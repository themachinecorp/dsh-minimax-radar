/**
 * dsh-minimax-radar — MiniMax 用量雷达（Host 半）。
 *
 * 两路数据：
 *  1. 官方 Token Plan 额度接口 `/v1/token_plan/remains`：给出 5 小时窗口与周窗口的
 *     剩余百分比、以及各自的窗口结束时刻（= 重置时间）。
 *  2. 本机会话日志：按天汇总 MiniMax 的 token 实际消耗（未缓存输入 / 输出 / 缓存
 *     读取 / 缓存写入），并按官方按量价目折算成人民币估算值。
 *
 * 两路都只在本机完成；API Key 不离开 Host 进程，浏览器只拿到聚合后的数字。
 * 数据经由一条受 dsh `/api` 信任栅栏保护的只读路由交给 Web 端。
 *
 * 零运行时依赖：不 import 任何 @deepseek-ai/* 包，服务一律通过 ctx.get(...) 取，
 * 这样作为 link 安装的工作区插件也不必解析 profile 的 node_modules。
 */

export const name = 'minimax-radar'
export const inject = ['webServer']

/** 只读状态路由（精确路径；精确表优先于 connection 的 /api 前缀路由）。 */
const ROUTE_STATE = '/api/minimax-radar/state'

/** 官方额度接口。CN 站为主，Global 站作可选第二区域。 */
const REMAINS_URLS = {
  cn: ['https://api.minimaxi.com/v1/token_plan/remains', 'https://www.minimaxi.com/v1/token_plan/remains'],
  global: ['https://www.minimax.io/v1/token_plan/remains', 'https://api.minimax.io/v1/token_plan/remains'],
}

/** 每个区域可用的凭据名，按优先级尝试；进程环境变量作为兜底。 */
const KEY_REFS = {
  cn: ['MINIMAX_CN_API_KEY'],
  global: ['MINIMAX_API_KEY'],
}

/**
 * 按量后付费标准档价目（元 / 百万 tokens）。
 * 来源：MiniMax 开放平台「语言模型」价目表，2026-11 抓取。优先档为 1.5 倍，这里按标准档估算。
 */
const PRICES = {
  'minimax-m3.1-flash': { input: 1.0, output: 4.0, cacheRead: 0.1 },
}

/** 额度缓存多久（官方接口不必每次轮询都打）。 */
const QUOTA_TTL_MS = 45_000
/** 本机会话日志汇总缓存多久（每次都要解 zstd，别太频繁）。 */
const USAGE_TTL_MS = 60_000
/** 单次 HTTP 请求超时。 */
const FETCH_TIMEOUT_MS = 8_000

export function apply(ctx) {
  const quotaCache = createCache(QUOTA_TTL_MS)
  const usageCache = createCache(USAGE_TTL_MS)

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () =>
        webCtx.webServer.register({
          kind: 'exact',
          path: ROUTE_STATE,
          handler: (req, res) => {
            void handleState(ctx, req, res, quotaCache, usageCache)
          },
        }),
      'minimax-radar: state route',
    )
  })
}

/* ------------------------------------------------------------------ route ---- */

async function handleState(ctx, req, res, quotaCache, usageCache) {
  // 与 dsh 自带 /api 同一套放行规则：回环 / 监听地址 / trustedHosts + 浏览器会话。
  const rejection = fenceOf(ctx, req)
  if (rejection !== undefined) {
    sendJson(res, rejection, { error: rejection === 401 ? 'unauthorized: browser session required' : 'forbidden: untrusted authority' })
    return
  }
  if (String(req.method ?? 'GET').toUpperCase() !== 'GET') {
    sendJson(res, 405, { error: 'method not allowed' })
    return
  }

  const url = new URL(req.url ?? '/', 'http://internal')
  const force = url.searchParams.get('force') === '1'

  const [quota, usage] = await Promise.all([
    quotaCache.read(force, () => loadQuota(ctx)),
    usageCache.read(force, () => loadUsage(ctx)),
  ])

  sendJson(res, 200, {
    ok: true,
    generatedAt: Date.now(),
    quota,
    usage,
    pricing: {
      currency: 'CNY',
      basis: '按量后付费标准档；优先档为 1.5 倍',
      table: PRICES,
    },
  })
}

/**
 * 复用 dsh 自己的 /api 信任栅栏；没有 connection 服务时退化为只允许回环。
 * @param ctx - 插件上下文。
 * @param req - Node 请求。
 * @returns 401 / 403 / undefined（放行）。
 */
function fenceOf(ctx, req) {
  const connection = ctx.get('connection')
  if (connection !== undefined && typeof connection.requestRejection === 'function') {
    try {
      return connection.requestRejection({ headers: req.headers })
    } catch {
      return 403
    }
  }
  const remote = String(req.socket?.remoteAddress ?? '')
  const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1' || remote === ''
  return loopback ? undefined : 403
}

function sendJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

/* ------------------------------------------------------------------ cache ---- */

/**
 * 单槽 TTL 缓存，带同刻去重：并发请求共享同一个进行中的读取。
 * @param ttlMs - 命中窗口。
 * @returns { read(force, load) }。
 */
function createCache(ttlMs) {
  let at = 0
  let value
  let inflight
  return {
    async read(force, load) {
      if (!force && value !== undefined && Date.now() - at < ttlMs) return value
      if (inflight !== undefined) return inflight
      inflight = (async () => {
        try {
          const next = await load()
          value = next
          at = Date.now()
          return next
        } finally {
          inflight = undefined
        }
      })()
      return inflight
    },
  }
}

/* ------------------------------------------------------------------ quota ---- */

/**
 * 读官方 Token Plan 额度。只查询已配置凭据的区域。
 * @param ctx - 插件上下文。
 * @returns 归一化后的额度快照。
 */
async function loadQuota(ctx) {
  const keys = await resolveKeys(ctx)
  const regions = Object.keys(keys)
  if (regions.length === 0) {
    return { ok: false, region: null, error: '未配置 MiniMax 订阅 Key（MINIMAX_CN_API_KEY / MINIMAX_API_KEY）', models: [] }
  }

  let lastError
  for (const region of regions) {
    try {
      const payload = await fetchRemains(region, keys[region])
      const snapshot = normalizeQuota(payload, region)
      if (snapshot.ok) return snapshot
      lastError = snapshot.error
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
  }
  return { ok: false, region: regions[0] ?? null, error: lastError ?? '额度查询失败', models: [] }
}

async function resolveKeys(ctx) {
  const credentials = ctx.get('credentials')
  const out = {}
  for (const [region, refs] of Object.entries(KEY_REFS)) {
    for (const ref of refs) {
      const value = await resolveOne(credentials, ref)
      if (value !== undefined) {
        out[region] = value
        break
      }
    }
  }
  return out
}

async function resolveOne(credentials, ref) {
  if (credentials !== undefined && typeof credentials.resolve === 'function') {
    try {
      const hit = await credentials.resolve(ref)
      const value = hit?.value
      if (typeof value === 'string' && value.length > 0) return value
    } catch {
      /* 落到环境变量 */
    }
  }
  const ambient = process.env[ref]
  return typeof ambient === 'string' && ambient.length > 0 ? ambient : undefined
}

async function fetchRemains(region, apiKey) {
  let lastError
  for (const url of REMAINS_URLS[region]) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
      const text = await response.text()
      let body = {}
      if (text.trim().length > 0) {
        try {
          body = JSON.parse(text)
        } catch {
          throw new Error('额度接口返回了无法解析的内容')
        }
      }
      if (!response.ok) {
        const message = body?.base_resp?.status_msg
        if (response.status === 401 || response.status === 403) {
          throw new Error('Key 无效，或不是订阅 Key（Token Plan 额度查询不能用按量付费 Key）')
        }
        throw new Error(typeof message === 'string' && message.length > 0 ? message : `额度查询失败 (HTTP ${response.status})`)
      }
      return body
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      // 认证类错误换域名也没用，直接抛出。
      if (/Key 无效/.test(lastError.message)) throw lastError
    }
  }
  throw lastError ?? new Error('额度查询失败')
}

/**
 * 把官方返回归一化成浏览器直接可用的形状。
 * @param payload - 接口原始 JSON。
 * @param region - 站点区域。
 * @returns 额度快照。
 */
function normalizeQuota(payload, region) {
  const root = isRecord(payload) ? payload : {}
  const base = isRecord(root.base_resp) ? root.base_resp : undefined
  const statusCode = num(base?.status_code)
  if (statusCode !== undefined && statusCode !== 0) {
    const message = str(base?.status_msg) ?? `MiniMax 返回错误 (${statusCode})`
    return { ok: false, region, error: statusCode === 1004 ? 'Key 无效，或不是订阅 Key' : message, models: [] }
  }

  const raw = root.model_remains ?? root.models ?? root.data
  const rows = Array.isArray(raw) ? raw.filter(isRecord) : []
  if (rows.length === 0) return { ok: false, region, error: '额度接口未返回模型行', models: [] }

  const now = Date.now()
  const models = []
  for (const row of rows) {
    const modelName = str(row.model_name) ?? str(row.name)
    if (modelName === undefined) continue
    models.push({
      name: modelName,
      interval: windowOf(row, 'interval', now),
      weekly: windowOf(row, 'weekly', now),
    })
  }
  if (models.length === 0) return { ok: false, region, error: '额度接口未返回可用模型行', models: [] }

  return {
    ok: true,
    region,
    plan: str(root.current_subscribe_title) ?? str(root.plan_name) ?? null,
    fetchedAt: now,
    models,
  }
}

function windowOf(row, kind, now) {
  const percentKeys =
    kind === 'interval'
      ? ['current_interval_remaining_percent', 'interval_remaining_percent', 'current_interval_remain_percent']
      : ['current_weekly_remaining_percent', 'weekly_remaining_percent']
  const percent = clamp01to100(pickNumber(row, percentKeys))

  const endKeys = kind === 'interval' ? ['end_time', 'current_interval_end_time'] : ['weekly_end_time', 'current_weekly_end_time']
  const remainsKeys =
    kind === 'interval' ? ['remains_time', 'current_interval_remains_time'] : ['weekly_remains_time', 'current_weekly_remains_time']

  let resetAt = normalizeEpochMs(pickNumber(row, endKeys))
  if (resetAt === undefined) {
    const remains = pickNumber(row, remainsKeys)
    if (remains !== undefined && remains >= 0) resetAt = now + remains
  }

  return {
    remaining: percent ?? null,
    resetAt: resetAt ?? null,
  }
}

/* ------------------------------------------------------------------ usage ---- */

/**
 * 扫全部会话日志，按天汇总 MiniMax 的 token 消耗。
 * 走 ctx.sessionPersistence（后端自己解多帧 zstd，插件不用碰压缩）。
 * @param ctx - 插件上下文。
 * @returns 用量快照。
 */
async function loadUsage(ctx) {
  const persistence = ctx.get('sessionPersistence')
  if (persistence === undefined || typeof persistence.list !== 'function') {
    return { ok: false, error: '当前 profile 没有 sessionPersistence 服务', days: [], byModel: [], totals: null }
  }

  const snapshots = await persistence.list()
  const byDay = new Map()
  const byModel = new Map()
  let sessions = 0
  let scanned = 0

  for (const snapshot of snapshots) {
    const sessionId = snapshot?.header?.id
    if (typeof sessionId !== 'string') continue
    sessions += 1
    let handle
    try {
      handle = await persistence.open(sessionId, 'read')
      // fork 出来的会话前段是从父会话继承的，从继承点开始读，避免重复计一遍父会话的用量。
      const start = Number(handle.inheritedEventCount ?? 0) || 0
      const result = await handle.read(start, Number.MAX_SAFE_INTEGER)
      const events = Array.isArray(result?.events) ? result.events : []
      scanned += foldEvents(events, byDay, byModel)
    } catch {
      /* 单个会话读不出来不影响其余会话 */
    } finally {
      try {
        await handle?.close?.()
      } catch {
        /* ignore */
      }
    }
  }

  const days = [...byDay.entries()]
    .map(([date, bucket]) => ({ date, ...bucket, cost: costOf(bucket) }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  const totals = emptyBucket()
  for (const day of days) addBucket(totals, day)

  const models = [...byModel.entries()]
    .map(([model, bucket]) => ({ model, ...bucket, cost: costOf(bucket, model) }))
    .sort((a, b) => b.total - a.total)

  return {
    ok: true,
    sessions,
    events: scanned,
    days,
    today: days.find((day) => day.date === localDay(Date.now())) ?? { date: localDay(Date.now()), ...emptyBucket(), cost: 0 },
    totals: { ...totals, cost: days.reduce((sum, day) => sum + day.cost, 0) },
    byModel: models,
    cacheHitRate: cacheHitRate(totals),
  }
}

/**
 * 从事件流里折叠出 usage 桶。
 * @returns 命中的 assistant/message 条数（诊断用）。
 */
function foldEvents(events, byDay, byModel) {
  let hits = 0
  for (const event of events) {
    if (event?.type !== 'assistant/message') continue
    const usage = event.data?.usage
    if (usage === null || typeof usage !== 'object') continue
    const source = event.data?.message?.source
    if (source?.kind !== 'model') continue
    const provider = String(source.provider ?? '')
    if (!provider.startsWith('minimax')) continue

    const model = String(source.model ?? 'unknown')
    const day = localDay(Number(event.time) || Date.now())
    const bucket = {
      input: num(usage.inputTokens) ?? 0,
      output: num(usage.outputTokens) ?? 0,
      cacheRead: num(usage.cacheReadTokens) ?? 0,
      cacheWrite: num(usage.cacheWriteTokens) ?? 0,
    }
    bucket.total = bucket.input + bucket.output + bucket.cacheRead + bucket.cacheWrite
    bucket.calls = 1

    const dayBucket = byDay.get(day) ?? emptyBucket()
    addBucket(dayBucket, bucket)
    byDay.set(day, dayBucket)

    const modelBucket = byModel.get(model) ?? emptyBucket()
    addBucket(modelBucket, bucket)
    byModel.set(model, modelBucket)

    hits += 1
  }
  return hits
}

function emptyBucket() {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, calls: 0 }
}

function addBucket(target, delta) {
  target.input += delta.input ?? 0
  target.output += delta.output ?? 0
  target.cacheRead += delta.cacheRead ?? 0
  target.cacheWrite += delta.cacheWrite ?? 0
  target.total += delta.total ?? 0
  target.calls += delta.calls ?? 0
}

/**
 * 按官方按量价目折算人民币。没有公开单价的模型不计价（不猜）。
 * @returns 金额（元）；未知模型为 0。
 */
function costOf(bucket, model) {
  if (model === undefined) {
    // 全天合计：按当天出现过的模型分别计价由调用方处理，这里用主模型兜底。
    model = Object.keys(PRICES)[0]
  }
  const price = PRICES[String(model).toLowerCase()]
  if (price === undefined) return 0
  const million = (n) => (Number.isFinite(n) ? n : 0) / 1_000_000
  const cost =
    million(bucket.input) * price.input +
    million(bucket.output) * price.output +
    million(bucket.cacheRead) * price.cacheRead +
    million(bucket.cacheWrite) * price.input // 价目表未列缓存写入，保守按输入档计
  return Math.round(cost * 100) / 100
}

function cacheHitRate(bucket) {
  const denom = bucket.input + bucket.cacheRead
  return denom > 0 ? Math.round((bucket.cacheRead / denom) * 1000) / 10 : null
}

/* ---------------------------------------------------------------- helpers ---- */

function localDay(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function str(value) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function num(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

function pickNumber(row, keys) {
  for (const key of keys) {
    const value = num(row[key])
    if (value !== undefined) return value
  }
  return undefined
}

function clamp01to100(value) {
  if (value === undefined || Number.isNaN(value)) return undefined
  return Math.min(100, Math.max(0, value))
}

function normalizeEpochMs(value) {
  if (value === undefined || value <= 0) return undefined
  if (value > 1e12) return value
  if (value > 1e9) return value * 1000
  return undefined
}
