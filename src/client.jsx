/**
 * dsh-minimax-radar — MiniMax 用量雷达（Client 半）。
 *
 * 三个落点，共用一份轮询数据：
 *  1. `sidebar.panellist` —— 左侧栏的雷达图标，点开主面板。
 *  2. `sidebar.footer.action` —— 侧边栏底部的常驻读数条（5h 余量 / 重置倒计时）。
 *  3. `main` —— 完整仪表盘。
 *
 * 配色刻意做成「金白水黑」：纯黑底、纯白墨，不跟随主题色相，读起来像一块
 * 仪器面板，而不是网页里的一张卡片。
 *
 * 本文件是 JSX 源；`npm run build`（esbuild）产出仓库根的 client.js，
 * 因为 dsh 的 Client 模块系统直接执行该文件的字节。
 */

window.__ModuleLoader__.load({
  id: 'dsh-minimax-radar',
  factory(require) {
    const React = require('react')
    const NS = 'minimax-radar'

    /* ------------------------------------------------------------- locale ---- */

    const zh = {
      'entry.label': 'MiniMax 用量',
      'panel.title': 'MiniMax 用量雷达',
      'panel.subtitle': 'Token Plan',
      'panel.refresh': '刷新',
      'panel.reading': '读取中',
      'panel.stale': '更新于',
      'card.today': '今日',
      'card.reset': '重置',
      'state.unconfigured': '未配置订阅 Key',
      'state.error': '读取失败',
      'ring.5h': '5 小时窗口',
      'ring.week': '周窗口',
      'ring.left': '剩余',
      'metric.todayIn': '今日输入',
      'metric.todayOut': '今日输出',
      'metric.cacheHit': '缓存命中',
      'metric.cost': '今日估算',
      'chart.title': '近 7 天 token',
      'chart.empty': '暂无本地用量',
      'models.title': '按模型',
      'note.source': '额度来自 MiniMax 官方接口；用量来自本机会话日志，费用为按量价目估算。',
      'back': '返回会话',
    }

    const en = {
      'entry.label': 'MiniMax Usage',
      'panel.title': 'MiniMax Usage Radar',
      'panel.subtitle': 'Token Plan',
      'panel.refresh': 'Refresh',
      'panel.reading': 'Reading',
      'panel.stale': 'updated',
      'card.today': 'Today',
      'card.reset': 'Reset',
      'state.unconfigured': 'No subscription key',
      'state.error': 'Read failed',
      'ring.5h': '5-hour window',
      'ring.week': 'Weekly window',
      'ring.left': 'left',
      'metric.todayIn': 'Input today',
      'metric.todayOut': 'Output today',
      'metric.cacheHit': 'Cache hit',
      'metric.cost': 'Est. today',
      'chart.title': 'Last 7 days',
      'chart.empty': 'No local usage yet',
      'models.title': 'By model',
      'note.source': 'Quota from the MiniMax API; usage from local session logs; cost is a pay-as-you-go estimate.',
      'back': 'Back to chat',
    }

    /* -------------------------------------------------------------- style ---- */

    const CSS = `
/* 金=白、水=黑：严格无彩色。墨色与底色随宿主明暗主题反相，永远是纯黑 + 纯白两级。 */
.mmr_root{--mmr-ink:#0a0a0a;--mmr-ink-2:rgba(10,10,10,.62);--mmr-ink-3:rgba(10,10,10,.36);--mmr-rule:rgba(10,10,10,.16);--mmr-rule-2:rgba(10,10,10,.07);--mmr-ground:#fff;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1}
body[data-ds-dark-theme] .mmr_root{--mmr-ink:#fdfdfd;--mmr-ink-2:rgba(253,253,253,.64);--mmr-ink-3:rgba(253,253,253,.36);--mmr-rule:rgba(253,253,253,.18);--mmr-rule-2:rgba(253,253,253,.08);--mmr-ground:#050505}
.mmr_dash{box-sizing:border-box;width:100%;max-width:960px;margin:0 auto;padding:28px 32px 40px;color:var(--mmr-ink);background:var(--mmr-ground);min-height:100%;font-variant-numeric:tabular-nums;font-feature-settings:'tnum' 1;background-image:linear-gradient(var(--mmr-rule-2) 1px,transparent 1px),linear-gradient(90deg,var(--mmr-rule-2) 1px,transparent 1px);background-size:44px 44px}
.mmr_head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-bottom:16px;border-bottom:1px solid var(--mmr-rule)}
.mmr_title{display:flex;align-items:baseline;gap:10px;font-size:15px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;margin:0}
.mmr_title small{color:var(--mmr-ink-3);font-size:10px;font-weight:500;letter-spacing:.24em}
.mmr_actions{display:flex;align-items:center;gap:12px}
.mmr_stamp{font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mmr-ink-3);white-space:nowrap}
.mmr_ghost{appearance:none;border:1px solid var(--mmr-rule);background:transparent;color:var(--mmr-ink-2);font:inherit;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;padding:6px 11px;cursor:pointer;transition:color .12s,border-color .12s,background .12s}
.mmr_ghost:hover{color:var(--mmr-ink);border-color:var(--mmr-ink-3);background:var(--mmr-rule-2)}
.mmr_ghost:focus-visible{outline:1px solid var(--mmr-ink);outline-offset:2px}
.mmr_ghost[disabled]{opacity:.4;cursor:progress}

.mmr_grid{display:grid;grid-template-columns:auto minmax(220px,300px);gap:48px;justify-content:space-between;align-items:center;padding:30px 0 26px}
.mmr_rings{display:flex;align-items:center;gap:26px}
.mmr_ring{position:relative;display:grid;place-items:center}
.mmr_ring svg{display:block;transform:rotate(-90deg)}
.mmr_ring_c{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;pointer-events:none}
.mmr_ring_n{font-size:30px;font-weight:600;letter-spacing:-.02em;line-height:1}
.mmr_ring_n i{font-style:normal;font-size:13px;font-weight:500;color:var(--mmr-ink-2);margin-left:1px}
.mmr_ring_l{font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--mmr-ink-2)}
.mmr_ring_s{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--mmr-ink-3);margin-top:2px;text-align:center;max-width:120px}
.mmr_small .mmr_ring_n{font-size:21px}
.mmr_small .mmr_ring_l{font-size:8px}

.mmr_resets{display:flex;flex-direction:column;gap:0;min-width:0;width:100%;border-left:1px solid var(--mmr-rule-2);padding-left:26px}
.mmr_reset{display:flex;flex-direction:column;gap:5px;padding:11px 0;border-bottom:1px solid var(--mmr-rule-2)}
.mmr_reset:first-child{padding-top:0}
.mmr_reset:last-child{border-bottom:0;padding-bottom:0}
.mmr_reset_k{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--mmr-ink-3);white-space:nowrap}
.mmr_reset_v{font-size:19px;font-weight:500;letter-spacing:.03em;white-space:nowrap;font-variant-numeric:tabular-nums}
.mmr_reset_v.dim{color:var(--mmr-ink-3);font-size:15px}

.mmr_metrics{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid var(--mmr-rule);border-bottom:1px solid var(--mmr-rule)}
.mmr_metric{padding:15px 18px 16px;border-right:1px solid var(--mmr-rule-2);min-width:0}
.mmr_metric:last-child{border-right:0}
.mmr_metric_k{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--mmr-ink-3);margin-bottom:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mmr_metric_v{font-size:19px;font-weight:500;letter-spacing:-.01em;white-space:nowrap}
.mmr_metric_v u{text-decoration:none;font-size:11px;color:var(--mmr-ink-3);margin-left:3px}

.mmr_lower{display:grid;grid-template-columns:1fr 260px;gap:30px;padding-top:26px}
.mmr_sec_h{display:flex;align-items:center;justify-content:space-between;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:var(--mmr-ink-3);margin-bottom:14px}
.mmr_chart{display:flex;align-items:flex-end;gap:6px;height:104px;border-bottom:1px solid var(--mmr-rule);padding-bottom:0}
.mmr_bar{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;min-width:0;position:relative}
.mmr_bar_i{width:100%;background:var(--mmr-ink);opacity:.86;transition:opacity .12s;position:relative}
.mmr_bar:hover .mmr_bar_i{opacity:1}
.mmr_bar_i.b{background:var(--mmr-ink);opacity:.26}
.mmr_bar:hover .mmr_bar_i.b{opacity:.5}
.mmr_bar_d{font-size:8.5px;color:var(--mmr-ink-3);letter-spacing:.06em;padding-top:6px;white-space:nowrap}
.mmr_bar_tip{position:absolute;bottom:calc(100% + 6px);left:50%;transform:translateX(-50%);background:var(--mmr-ink);border:1px solid var(--mmr-ink);color:var(--mmr-ground);font-size:9.5px;padding:3px 6px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .1s;z-index:3}
.mmr_bar:hover .mmr_bar_tip{opacity:1}
.mmr_empty{height:104px;display:grid;place-items:center;color:var(--mmr-ink-3);font-size:11px;border-bottom:1px solid var(--mmr-rule)}

.mmr_models{display:flex;flex-direction:column;gap:0}
.mmr_model{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--mmr-rule-2);font-size:11.5px}
.mmr_model:last-child{border-bottom:0}
.mmr_model_n{color:var(--mmr-ink-2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mmr_model_v{color:var(--mmr-ink);white-space:nowrap}

.mmr_note{margin-top:28px;padding-top:14px;border-top:1px solid var(--mmr-rule-2);font-size:10px;line-height:1.6;color:var(--mmr-ink-3)}
.mmr_state{display:flex;flex-direction:column;align-items:center;gap:10px;padding:64px 24px;border:1px dashed var(--mmr-rule);color:var(--mmr-ink-2);font-size:12px;text-align:center;letter-spacing:.02em}
.mmr_state b{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--mmr-ink-3);font-weight:500}

/* ---- sidebar card ---- */
.mmr_card{box-sizing:border-box;width:100%;display:flex;align-items:center;gap:9px;padding:8px 10px;margin:0 0 2px;border:1px solid var(--mmr-rule);background:var(--mmr-ground);color:var(--mmr-ink);font:inherit;font-size:11px;line-height:1.2;cursor:pointer;text-align:left;transition:border-color .12s,background .12s;font-variant-numeric:tabular-nums}
.mmr_card:hover{border-color:var(--mmr-ink-3)}
.mmr_card:focus-visible{outline:1px solid var(--mmr-ink);outline-offset:1px}
.mmr_card_g{flex:none;display:grid;place-items:center;width:18px;height:18px}
.mmr_card_b{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}
.mmr_card_r{display:flex;align-items:baseline;gap:6px;min-width:0}
.mmr_card_k{font-size:8.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--mmr-ink-3);flex:none}
.mmr_card_v{font-size:12.5px;font-weight:600;letter-spacing:.01em;white-space:nowrap}
.mmr_card_m{font-size:9.5px;color:var(--mmr-ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mmr_card_m b{color:var(--mmr-ink);font-weight:500}

@media (max-width:820px){
  .mmr_dash{padding:20px 18px 32px}
  .mmr_grid{grid-template-columns:1fr;gap:24px}
  .mmr_lower{grid-template-columns:1fr;gap:24px}
  .mmr_metrics{grid-template-columns:repeat(2,1fr)}
  .mmr_metric:nth-child(2){border-right:0}
  .mmr_metric:nth-child(3){border-top:1px solid var(--mmr-rule-2)}
  .mmr_metric:nth-child(4){border-top:1px solid var(--mmr-rule-2);border-right:0}
}
@media (prefers-reduced-motion:reduce){.mmr_bar_i,.mmr_card,.mmr_ghost{transition:none}}
`

    /**
     * 样式注入。data-plugin / data-plugin-css 让 Client 模块系统接管生命周期
     * （卸载时自动移除），也让 HMR 重载复用同一个 tag 而不是叠一层。
     */
    const STYLE_ID = 'dsh-minimax-radar/radar.css'
    if (typeof document !== 'undefined') {
      const existing = document.querySelector('style[data-plugin-css=' + JSON.stringify(STYLE_ID) + ']')
      if (existing !== null) {
        existing.textContent = CSS
      } else {
        const tag = document.createElement('style')
        tag.dataset.plugin = 'dsh-minimax-radar'
        tag.dataset.pluginCss = STYLE_ID
        tag.textContent = CSS
        document.head.appendChild(tag)
      }
    }

    /* --------------------------------------------------------------- util ---- */

    const fmtInt = (n) => (typeof n === 'number' ? Math.round(n).toLocaleString('en-US') : '—')
    const fmtCompact = (n) => {
      if (typeof n !== 'number' || !Number.isFinite(n)) return '—'
      const a = Math.abs(n)
      if (a >= 1e9) return (n / 1e9).toFixed(2) + 'B'
      if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
      if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
      return String(Math.round(n))
    }
    const fmtMoney = (n) => (typeof n === 'number' ? '¥' + n.toFixed(2) : '—')
    const fmtPct = (n) => (typeof n === 'number' ? String(Math.round(n)) : '—')

    function countdown(ms) {
      if (typeof ms !== 'number' || !Number.isFinite(ms)) return '—'
      if (ms <= 0) return '重置中'
      const total = Math.floor(ms / 1000)
      const d = Math.floor(total / 86400)
      const h = Math.floor((total % 86400) / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      const p = (x) => String(x).padStart(2, '0')
      if (d > 0) return `${d}天 ${p(h)}:${p(m)}`
      if (h > 0) return `${p(h)}:${p(m)}:${p(s)}`
      return `${p(m)}:${p(s)}`
    }

    /* -------------------------------------------------------------- store ---- */

    /** 单例数据源：侧边栏读数条和主面板共用一次轮询。 */
    function createStore() {
      let state = { status: 'loading', data: null, error: null, at: 0 }
      let last = null
      const listeners = new Set()
      const emit = () => {
        for (const fn of listeners) fn()
      }
      const read = () => state

      let timer = null
      let inflight = null

      async function pull(force) {
        if (inflight !== null) return inflight
        if (force) {
          state = { ...state, status: 'loading' }
          emit()
        }
        inflight = (async () => {
          try {
            const response = await fetch('/api/minimax-radar/state' + (force ? '?force=1' : ''), {
              headers: { accept: 'application/json' },
              credentials: 'same-origin',
            })
            const body = await response.json().catch(() => ({}))
            if (!response.ok || body?.ok !== true) {
              throw new Error(body?.error ?? `HTTP ${response.status}`)
            }
            last = body
            state = { status: 'ready', data: body, error: null, at: Date.now() }
          } catch (error) {
            state = {
              status: last !== null ? 'stale' : 'error',
              data: last,
              error: error instanceof Error ? error.message : String(error),
              at: last !== null ? state.at : 0,
            }
          } finally {
            inflight = null
            emit()
          }
        })()
        return inflight
      }

      return {
        subscribe(fn) {
          listeners.add(fn)
          if (timer === null) {
            void pull(false)
            timer = setInterval(() => void pull(false), 30_000)
          }
          return () => {
            listeners.delete(fn)
            if (listeners.size === 0 && timer !== null) {
              clearInterval(timer)
              timer = null
            }
          }
        },
        read,
        refresh: () => pull(true),
      }
    }

    /** React 绑定：useSyncExternalStore + 每秒重绘（倒计时用）。 */
    function useStore(store) {
      const snap = React.useSyncExternalStore(store.subscribe, store.read, store.read)
      const [, tick] = React.useState(0)
      React.useEffect(() => {
        const id = setInterval(() => tick((v) => v + 1), 1000)
        return () => clearInterval(id)
      }, [])
      return snap
    }

    /* ----------------------------------------------------------- components ---- */

    /** 侧边栏图标：一圈刻度加一道扫掠，未读数时只画空环。 */
    function RadarGlyph({ size = 18 }) {
      // 与宿主图标同笔重（1.2 / 实心）。三道同心弧 + 一条扫掠臂，18px 下仍能读成"雷达"。
      return React.createElement(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 18 18',
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'block' },
        },
        React.createElement('circle', { cx: 9, cy: 9, r: 6.9, stroke: 'currentColor', strokeWidth: 1.2 }),
        React.createElement('circle', { cx: 9, cy: 9, r: 3.7, stroke: 'currentColor', strokeWidth: 1.2, strokeOpacity: 0.5 }),
        React.createElement('path', {
          d: 'M9 9 L9 3.6 A5.4 5.4 0 0 1 14.1 12.4',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
        }),
        React.createElement('circle', { cx: 9, cy: 9, r: 1.35, fill: 'currentColor' }),
      )
    }

    const TICK = { color: 'currentColor', opacity: 0.3 }

    /** 环形仪表：轨道 + 余量弧 + 刻度。 */
    function Ring({ percent, size = 132, label, sub, small }) {
      const stroke = small ? 6 : 8
      const r = (size - stroke) / 2 - 6
      const c = 2 * Math.PI * r
      const p = typeof percent === 'number' ? Math.max(0, Math.min(100, percent)) : 0
      const dash = (c * p) / 100
      const cx = size / 2
      const ticks = []
      for (let i = 0; i < 60; i += 1) {
        const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
        const major = i % 5 === 0
        const r1 = r + stroke / 2 + 2
        const r2 = r1 + (major ? 4 : 2)
        ticks.push(
          React.createElement('line', {
            key: i,
            x1: cx + Math.cos(angle) * r1,
            y1: cx + Math.sin(angle) * r1,
            x2: cx + Math.cos(angle) * r2,
            y2: cx + Math.sin(angle) * r2,
            stroke: 'currentColor',
            strokeOpacity: major ? 0.42 : 0.18,
            strokeWidth: 1,
          }),
        )
      }
      return React.createElement(
        'div',
        { className: 'mmr_ring' + (small ? ' mmr_small' : '') },
        React.createElement(
          'svg',
          { width: size, height: size, viewBox: `0 0 ${size} ${size}`, 'aria-hidden': 'true' },
          ticks,
          React.createElement('circle', { cx, cy: cx, r, stroke: 'currentColor', strokeOpacity: 0.14, strokeWidth: stroke, fill: 'none' }),
          React.createElement('circle', {
            cx,
            cy: cx,
            r,
            stroke: 'currentColor',
            strokeWidth: stroke,
            fill: 'none',
            strokeLinecap: 'butt',
            strokeDasharray: `${dash} ${c}`,
            style: { transition: 'stroke-dasharray .5s cubic-bezier(.3,.7,.4,1)' },
          }),
        ),
        React.createElement(
          'div',
          { className: 'mmr_ring_c' },
          React.createElement('div', { className: 'mmr_ring_n' }, fmtPct(percent), React.createElement('i', null, '%')),
          label ? React.createElement('div', { className: 'mmr_ring_l' }, label) : null,
          sub ? React.createElement('div', { className: 'mmr_ring_s' }, sub) : null,
        ),
      )
    }

    /** 取主模型行：优先 general。 */
    function primaryModel(quota) {
      if (!quota?.ok || !Array.isArray(quota.models) || quota.models.length === 0) return null
      return quota.models.find((m) => m.name === 'general') ?? quota.models[0]
    }

    function quotaProblem(data) {
      const quota = data?.quota
      if (quota?.ok === true) return null
      const message = String(quota?.error ?? '')
      if (/未配置/.test(message)) return 'unconfigured'
      return message.length > 0 ? message : 'unconfigured'
    }

    /* ---- sidebar card ---- */

    function SidebarCard({ wide, store, t, open }) {
      const snap = useStore(store)
      if (!wide) return null

      const data = snap.data
      const model = primaryModel(data?.quota)
      const problem = quotaProblem(data)
      const interval = model?.interval
      const weekly = model?.weekly
      const remaining = countdown((interval?.resetAt ?? 0) - Date.now())
      const today = data?.usage?.today?.total

      const headline = problem === null ? fmtPct(interval?.remaining) + '%' : problem === 'unconfigured' ? '—' : '!'
      const sub =
        problem === null
          ? `重置 ${remaining}`
          : problem === 'unconfigured'
            ? t('state.unconfigured')
            : t('state.error')

      return React.createElement(
        'button',
        {
          type: 'button',
          className: 'mmr_card mmr_root',
          onClick: open,
          title: problem === null ? t('entry.label') + ' · ' + sub : String(problem),
          'aria-label': t('entry.label') + ' ' + headline,
        },
        React.createElement('span', { className: 'mmr_card_g' }, React.createElement(RadarGlyph, { size: 18 })),
        React.createElement(
          'span',
          { className: 'mmr_card_b' },
          React.createElement(
            'span',
            { className: 'mmr_card_r' },
            React.createElement('span', { className: 'mmr_card_k' }, '5H'),
            React.createElement('span', { className: 'mmr_card_v' }, headline),
            weekly && typeof weekly.remaining === 'number'
              ? React.createElement('span', { className: 'mmr_card_m' }, '7D ' + fmtPct(weekly.remaining) + '%')
              : null,
          ),
          React.createElement(
            'span',
            { className: 'mmr_card_m' },
            sub,
            typeof today === 'number' && today > 0
              ? React.createElement('b', null, ' · ' + t('card.today') + ' ' + fmtCompact(today))
              : null,
          ),
        ),
      )
    }

    /* ---- dashboard ---- */

    function Dashboard({ store, t, close }) {
      const snap = useStore(store)
      const data = snap.data
      const problem = quotaProblem(data)
      const model = primaryModel(data?.quota)
      const now = Date.now()

      const head = React.createElement(
        'div',
        { className: 'mmr_head' },
        React.createElement(
          'h2',
          { className: 'mmr_title' },
          t('panel.title'),
          React.createElement('small', null, t('panel.subtitle')),
        ),
        React.createElement(
          'div',
          { className: 'mmr_actions' },
          snap.at > 0
            ? React.createElement(
                'span',
                { className: 'mmr_stamp' },
                t('panel.stale') + ' ' + new Date(snap.at).toLocaleTimeString('zh-CN', { hour12: false }),
              )
            : null,
          React.createElement(
            'button',
            { type: 'button', className: 'mmr_ghost', onClick: () => store.refresh(), disabled: snap.status === 'loading' },
            snap.status === 'loading' ? t('panel.reading') : t('panel.refresh'),
          ),
          React.createElement('button', { type: 'button', className: 'mmr_ghost', onClick: close }, t('back')),
        ),
      )

      if (problem !== null) {
        return React.createElement(
          'div',
          { className: 'mmr_dash mmr_root' },
          head,
          React.createElement(
            'div',
            { className: 'mmr_state' },
            React.createElement('b', null, problem === 'unconfigured' ? t('state.unconfigured') : t('state.error')),
            React.createElement('span', null, String(problem === 'unconfigured' ? '在 设置 → 模型 里填入 MINIMAX_CN_API_KEY（订阅 Key）。' : problem)),
          ),
          React.createElement('div', { className: 'mmr_note' }, t('note.source')),
        )
      }

      const usage = data?.usage
      const today = usage?.today ?? {}
      const totals = usage?.totals ?? {}

      const rings = React.createElement(
        'div',
        { className: 'mmr_rings' },
        React.createElement(Ring, {
          percent: model?.interval?.remaining,
          label: '5H',
          size: 150,
        }),
        React.createElement(Ring, { percent: model?.weekly?.remaining, label: '7D', size: 104, small: true }),
      )

      const resets = React.createElement(
        'div',
        { className: 'mmr_resets' },
        React.createElement(
          'div',
          { className: 'mmr_reset' },
          React.createElement('span', { className: 'mmr_reset_k' }, t('ring.5h') + ' · ' + t('card.reset')),
          React.createElement('span', { className: 'mmr_reset_v' }, countdown((model?.interval?.resetAt ?? 0) - now)),
        ),
        React.createElement(
          'div',
          { className: 'mmr_reset' },
          React.createElement('span', { className: 'mmr_reset_k' }, t('ring.week') + ' · ' + t('card.reset')),
          React.createElement('span', { className: 'mmr_reset_v' }, countdown((model?.weekly?.resetAt ?? 0) - now)),
        ),
        React.createElement(
          'div',
          { className: 'mmr_reset' },
          React.createElement('span', { className: 'mmr_reset_k' }, 'SITE'),
          React.createElement(
            'span',
            { className: 'mmr_reset_v dim' },
            String(data?.quota?.region === 'cn' ? '国内站' : data?.quota?.region === 'global' ? '国际站' : '—'),
          ),
        ),
      )

      const metrics = React.createElement(
        'div',
        { className: 'mmr_metrics' },
        React.createElement(
          'div',
          { className: 'mmr_metric' },
          React.createElement('div', { className: 'mmr_metric_k' }, t('metric.todayIn')),
          React.createElement(
            'div',
            { className: 'mmr_metric_v' },
            fmtCompact(today.input),
            React.createElement('u', null, 'tok'),
          ),
        ),
        React.createElement(
          'div',
          { className: 'mmr_metric' },
          React.createElement('div', { className: 'mmr_metric_k' }, t('metric.todayOut')),
          React.createElement(
            'div',
            { className: 'mmr_metric_v' },
            fmtCompact(today.output),
            React.createElement('u', null, 'tok'),
          ),
        ),
        React.createElement(
          'div',
          { className: 'mmr_metric' },
          React.createElement('div', { className: 'mmr_metric_k' }, t('metric.cacheHit')),
          React.createElement(
            'div',
            { className: 'mmr_metric_v' },
            (() => {
              const denom = (today.input ?? 0) + (today.cacheRead ?? 0)
              return denom > 0 ? (Math.round(((today.cacheRead ?? 0) / denom) * 1000) / 10).toFixed(1) : '—'
            })(),
            React.createElement('u', null, '%'),
          ),
        ),
        React.createElement(
          'div',
          { className: 'mmr_metric' },
          React.createElement('div', { className: 'mmr_metric_k' }, t('metric.cost')),
          React.createElement('div', { className: 'mmr_metric_v' }, fmtMoney(today.cost)),
        ),
      )

      const days = Array.isArray(usage?.days) ? usage.days.slice(-7) : []
      const max = days.reduce((m, d) => Math.max(m, d.total ?? 0), 0)
      const chart =
        days.length === 0
          ? React.createElement('div', { className: 'mmr_empty' }, t('chart.empty'))
          : React.createElement(
              'div',
              { className: 'mmr_chart' },
              days.map((d) => {
                const h = max > 0 ? Math.max(2, Math.round(((d.total ?? 0) / max) * 84)) : 2
                const isToday = d.date === days[days.length - 1]?.date
                return React.createElement(
                  'div',
                  { key: d.date, className: 'mmr_bar' },
                  React.createElement('span', { className: 'mmr_bar_tip' }, d.date + ' · ' + fmtCompact(d.total)),
                  React.createElement('span', {
                    className: 'mmr_bar_i' + (isToday ? '' : ' b'),
                    style: { height: h + 'px' },
                  }),
                  React.createElement('span', { className: 'mmr_bar_d' }, d.date.slice(5)),
                )
              }),
            )

      const models = Array.isArray(usage?.byModel) ? usage.byModel.slice(0, 6) : []

      return React.createElement(
        'div',
        { className: 'mmr_dash mmr_root' },
        head,
        React.createElement('div', { className: 'mmr_grid' }, rings, resets),
        metrics,
        React.createElement(
          'div',
          { className: 'mmr_lower' },
          React.createElement(
            'section',
            null,
            React.createElement(
              'div',
              { className: 'mmr_sec_h' },
              React.createElement('span', null, t('chart.title')),
              React.createElement('span', null, fmtCompact(totals.total) + ' tok · ' + fmtInt(usage?.sessions ?? 0) + ' sessions'),
            ),
            chart,
          ),
          React.createElement(
            'section',
            null,
            React.createElement('div', { className: 'mmr_sec_h' }, React.createElement('span', null, t('models.title'))),
            React.createElement(
              'div',
              { className: 'mmr_models' },
              models.length === 0
                ? React.createElement('div', { className: 'mmr_empty', style: { height: 'auto', borderBottom: 0, padding: '10px 0', justifyItems: 'start' } }, '—')
                : models.map((m) =>
                    React.createElement(
                      'div',
                      { key: m.model, className: 'mmr_model' },
                      React.createElement('span', { className: 'mmr_model_n', title: m.model }, m.model),
                      React.createElement('span', { className: 'mmr_model_v' }, fmtCompact(m.total)),
                    ),
                  ),
            ),
          ),
        ),
        React.createElement('div', { className: 'mmr_note' }, t('note.source')),
      )
    }

    function apply(ctx) {
      const store = createStore()

      const locale = ctx.get('locale')
      if (locale !== undefined) {
        ctx.effect(() => locale.register(NS, { zh, en }), 'minimax-radar: dictionaries')
      }
      const t = locale !== undefined ? locale.bind(NS) : (key) => zh[key] ?? key

      const open = () => {
        const layout = ctx.get('layout')
        if (layout !== undefined && typeof layout.selectPanel === 'function') {
          try {
            layout.selectPanel('minimax-radar')
          } catch {
            /* 面板没注册时保持原样 */
          }
        }
      }
      const close = () => {
        const layout = ctx.get('layout')
        if (layout !== undefined && typeof layout.selectPanel === 'function') {
          try {
            layout.selectPanel(null)
          } catch {
            /* ignore */
          }
        }
      }

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.panellist', () =>
            ctx.slots.register(
              {
                name: 'sidebar.panellist',
                id: 'minimax-radar',
                order: 20,
                label: () => t('entry.label'),
                locale: NS,
              },
              RadarGlyph,
            ),
          ),
        'minimax-radar: sidebar entry',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('main', () =>
            ctx.slots.register(
              {
                name: 'main',
                key: 'minimax-radar',
                locale: NS,
                inject: () => ({ store, close }),
              },
              Dashboard,
            ),
          ),
        'minimax-radar: dashboard',
      )

      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.footer.action', () =>
            ctx.slots.register(
              {
                name: 'sidebar.footer.action',
                id: 'minimax-radar-chip',
                order: 5,
                label: () => t('entry.label'),
                locale: NS,
                inject: () => ({ store, open }),
              },
              SidebarCard,
            ),
          ),
        'minimax-radar: sidebar readout',
      )
    }

    return { inject: ['slots', 'locale', 'layout'], apply }
  },
})
