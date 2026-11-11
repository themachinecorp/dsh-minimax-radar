window.__ModuleLoader__.load({
  id: "dsh-minimax-radar",
  factory(require) {
    const React = require("react");
    const NS = "minimax-radar";
    const zh = {
      "entry.label": "MiniMax \u7528\u91CF",
      "panel.title": "MiniMax \u7528\u91CF\u96F7\u8FBE",
      "panel.subtitle": "Token Plan",
      "panel.refresh": "\u5237\u65B0",
      "panel.reading": "\u8BFB\u53D6\u4E2D",
      "panel.stale": "\u66F4\u65B0\u4E8E",
      "card.today": "\u4ECA\u65E5",
      "card.reset": "\u91CD\u7F6E",
      "state.unconfigured": "\u672A\u914D\u7F6E\u8BA2\u9605 Key",
      "state.error": "\u8BFB\u53D6\u5931\u8D25",
      "ring.5h": "5 \u5C0F\u65F6\u7A97\u53E3",
      "ring.week": "\u5468\u7A97\u53E3",
      "ring.left": "\u5269\u4F59",
      "metric.todayIn": "\u4ECA\u65E5\u8F93\u5165",
      "metric.todayOut": "\u4ECA\u65E5\u8F93\u51FA",
      "metric.cacheHit": "\u7F13\u5B58\u547D\u4E2D",
      "metric.cost": "\u4ECA\u65E5\u4F30\u7B97",
      "chart.title": "\u8FD1 7 \u5929 token",
      "chart.empty": "\u6682\u65E0\u672C\u5730\u7528\u91CF",
      "models.title": "\u6309\u6A21\u578B",
      "note.source": "\u989D\u5EA6\u6765\u81EA MiniMax \u5B98\u65B9\u63A5\u53E3\uFF1B\u7528\u91CF\u6765\u81EA\u672C\u673A\u4F1A\u8BDD\u65E5\u5FD7\uFF0C\u8D39\u7528\u4E3A\u6309\u91CF\u4EF7\u76EE\u4F30\u7B97\u3002",
      "back": "\u8FD4\u56DE\u4F1A\u8BDD"
    };
    const en = {
      "entry.label": "MiniMax Usage",
      "panel.title": "MiniMax Usage Radar",
      "panel.subtitle": "Token Plan",
      "panel.refresh": "Refresh",
      "panel.reading": "Reading",
      "panel.stale": "updated",
      "card.today": "Today",
      "card.reset": "Reset",
      "state.unconfigured": "No subscription key",
      "state.error": "Read failed",
      "ring.5h": "5-hour window",
      "ring.week": "Weekly window",
      "ring.left": "left",
      "metric.todayIn": "Input today",
      "metric.todayOut": "Output today",
      "metric.cacheHit": "Cache hit",
      "metric.cost": "Est. today",
      "chart.title": "Last 7 days",
      "chart.empty": "No local usage yet",
      "models.title": "By model",
      "note.source": "Quota from the MiniMax API; usage from local session logs; cost is a pay-as-you-go estimate.",
      "back": "Back to chat"
    };
    const CSS = `
/* \u91D1=\u767D\u3001\u6C34=\u9ED1\uFF1A\u4E25\u683C\u65E0\u5F69\u8272\u3002\u58A8\u8272\u4E0E\u5E95\u8272\u968F\u5BBF\u4E3B\u660E\u6697\u4E3B\u9898\u53CD\u76F8\uFF0C\u6C38\u8FDC\u662F\u7EAF\u9ED1 + \u7EAF\u767D\u4E24\u7EA7\u3002 */
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
`;
    const STYLE_ID = "dsh-minimax-radar/radar.css";
    if (typeof document !== "undefined") {
      const existing = document.querySelector("style[data-plugin-css=" + JSON.stringify(STYLE_ID) + "]");
      if (existing !== null) {
        existing.textContent = CSS;
      } else {
        const tag = document.createElement("style");
        tag.dataset.plugin = "dsh-minimax-radar";
        tag.dataset.pluginCss = STYLE_ID;
        tag.textContent = CSS;
        document.head.appendChild(tag);
      }
    }
    const fmtInt = (n) => typeof n === "number" ? Math.round(n).toLocaleString("en-US") : "\u2014";
    const fmtCompact = (n) => {
      if (typeof n !== "number" || !Number.isFinite(n)) return "\u2014";
      const a = Math.abs(n);
      if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
      if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
      if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
      return String(Math.round(n));
    };
    const fmtMoney = (n) => typeof n === "number" ? "\xA5" + n.toFixed(2) : "\u2014";
    const fmtPct = (n) => typeof n === "number" ? String(Math.round(n)) : "\u2014";
    function countdown(ms) {
      if (typeof ms !== "number" || !Number.isFinite(ms)) return "\u2014";
      if (ms <= 0) return "\u91CD\u7F6E\u4E2D";
      const total = Math.floor(ms / 1e3);
      const d = Math.floor(total / 86400);
      const h = Math.floor(total % 86400 / 3600);
      const m = Math.floor(total % 3600 / 60);
      const s = total % 60;
      const p = (x) => String(x).padStart(2, "0");
      if (d > 0) return `${d}\u5929 ${p(h)}:${p(m)}`;
      if (h > 0) return `${p(h)}:${p(m)}:${p(s)}`;
      return `${p(m)}:${p(s)}`;
    }
    function createStore() {
      let state = { status: "loading", data: null, error: null, at: 0 };
      let last = null;
      const listeners = /* @__PURE__ */ new Set();
      const emit = () => {
        for (const fn of listeners) fn();
      };
      const read = () => state;
      let timer = null;
      let inflight = null;
      async function pull(force) {
        if (inflight !== null) return inflight;
        if (force) {
          state = { ...state, status: "loading" };
          emit();
        }
        inflight = (async () => {
          try {
            const response = await fetch("/api/minimax-radar/state" + (force ? "?force=1" : ""), {
              headers: { accept: "application/json" },
              credentials: "same-origin"
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok || body?.ok !== true) {
              throw new Error(body?.error ?? `HTTP ${response.status}`);
            }
            last = body;
            state = { status: "ready", data: body, error: null, at: Date.now() };
          } catch (error) {
            state = {
              status: last !== null ? "stale" : "error",
              data: last,
              error: error instanceof Error ? error.message : String(error),
              at: last !== null ? state.at : 0
            };
          } finally {
            inflight = null;
            emit();
          }
        })();
        return inflight;
      }
      return {
        subscribe(fn) {
          listeners.add(fn);
          if (timer === null) {
            void pull(false);
            timer = setInterval(() => void pull(false), 3e4);
          }
          return () => {
            listeners.delete(fn);
            if (listeners.size === 0 && timer !== null) {
              clearInterval(timer);
              timer = null;
            }
          };
        },
        read,
        refresh: () => pull(true)
      };
    }
    function useStore(store) {
      const snap = React.useSyncExternalStore(store.subscribe, store.read, store.read);
      const [, tick] = React.useState(0);
      React.useEffect(() => {
        const id = setInterval(() => tick((v) => v + 1), 1e3);
        return () => clearInterval(id);
      }, []);
      return snap;
    }
    function RadarGlyph({ size = 18 }) {
      return React.createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 18 18",
          fill: "none",
          "aria-hidden": "true",
          style: { display: "block" }
        },
        React.createElement("circle", { cx: 9, cy: 9, r: 6.9, stroke: "currentColor", strokeWidth: 1.2 }),
        React.createElement("circle", { cx: 9, cy: 9, r: 3.7, stroke: "currentColor", strokeWidth: 1.2, strokeOpacity: 0.5 }),
        React.createElement("path", {
          d: "M9 9 L9 3.6 A5.4 5.4 0 0 1 14.1 12.4",
          stroke: "currentColor",
          strokeWidth: 1.2,
          strokeLinecap: "round"
        }),
        React.createElement("circle", { cx: 9, cy: 9, r: 1.35, fill: "currentColor" })
      );
    }
    const TICK = { color: "currentColor", opacity: 0.3 };
    function Ring({ percent, size = 132, label, sub, small }) {
      const stroke = small ? 6 : 8;
      const r = (size - stroke) / 2 - 6;
      const c = 2 * Math.PI * r;
      const p = typeof percent === "number" ? Math.max(0, Math.min(100, percent)) : 0;
      const dash = c * p / 100;
      const cx = size / 2;
      const ticks = [];
      for (let i = 0; i < 60; i += 1) {
        const angle = i / 60 * Math.PI * 2 - Math.PI / 2;
        const major = i % 5 === 0;
        const r1 = r + stroke / 2 + 2;
        const r2 = r1 + (major ? 4 : 2);
        ticks.push(
          React.createElement("line", {
            key: i,
            x1: cx + Math.cos(angle) * r1,
            y1: cx + Math.sin(angle) * r1,
            x2: cx + Math.cos(angle) * r2,
            y2: cx + Math.sin(angle) * r2,
            stroke: "currentColor",
            strokeOpacity: major ? 0.42 : 0.18,
            strokeWidth: 1
          })
        );
      }
      return React.createElement(
        "div",
        { className: "mmr_ring" + (small ? " mmr_small" : "") },
        React.createElement(
          "svg",
          { width: size, height: size, viewBox: `0 0 ${size} ${size}`, "aria-hidden": "true" },
          ticks,
          React.createElement("circle", { cx, cy: cx, r, stroke: "currentColor", strokeOpacity: 0.14, strokeWidth: stroke, fill: "none" }),
          React.createElement("circle", {
            cx,
            cy: cx,
            r,
            stroke: "currentColor",
            strokeWidth: stroke,
            fill: "none",
            strokeLinecap: "butt",
            strokeDasharray: `${dash} ${c}`,
            style: { transition: "stroke-dasharray .5s cubic-bezier(.3,.7,.4,1)" }
          })
        ),
        React.createElement(
          "div",
          { className: "mmr_ring_c" },
          React.createElement("div", { className: "mmr_ring_n" }, fmtPct(percent), React.createElement("i", null, "%")),
          label ? React.createElement("div", { className: "mmr_ring_l" }, label) : null,
          sub ? React.createElement("div", { className: "mmr_ring_s" }, sub) : null
        )
      );
    }
    function primaryModel(quota) {
      if (!quota?.ok || !Array.isArray(quota.models) || quota.models.length === 0) return null;
      return quota.models.find((m) => m.name === "general") ?? quota.models[0];
    }
    function quotaProblem(data) {
      const quota = data?.quota;
      if (quota?.ok === true) return null;
      const message = String(quota?.error ?? "");
      if (/未配置/.test(message)) return "unconfigured";
      return message.length > 0 ? message : "unconfigured";
    }
    function SidebarCard({ wide, store, t, open }) {
      const snap = useStore(store);
      if (!wide) return null;
      const data = snap.data;
      const model = primaryModel(data?.quota);
      const problem = quotaProblem(data);
      const interval = model?.interval;
      const weekly = model?.weekly;
      const remaining = countdown((interval?.resetAt ?? 0) - Date.now());
      const today = data?.usage?.today?.total;
      const headline = problem === null ? fmtPct(interval?.remaining) + "%" : problem === "unconfigured" ? "\u2014" : "!";
      const sub = problem === null ? `\u91CD\u7F6E ${remaining}` : problem === "unconfigured" ? t("state.unconfigured") : t("state.error");
      return React.createElement(
        "button",
        {
          type: "button",
          className: "mmr_card mmr_root",
          onClick: open,
          title: problem === null ? t("entry.label") + " \xB7 " + sub : String(problem),
          "aria-label": t("entry.label") + " " + headline
        },
        React.createElement("span", { className: "mmr_card_g" }, React.createElement(RadarGlyph, { size: 18 })),
        React.createElement(
          "span",
          { className: "mmr_card_b" },
          React.createElement(
            "span",
            { className: "mmr_card_r" },
            React.createElement("span", { className: "mmr_card_k" }, "5H"),
            React.createElement("span", { className: "mmr_card_v" }, headline),
            weekly && typeof weekly.remaining === "number" ? React.createElement("span", { className: "mmr_card_m" }, "7D " + fmtPct(weekly.remaining) + "%") : null
          ),
          React.createElement(
            "span",
            { className: "mmr_card_m" },
            sub,
            typeof today === "number" && today > 0 ? React.createElement("b", null, " \xB7 " + t("card.today") + " " + fmtCompact(today)) : null
          )
        )
      );
    }
    function Dashboard({ store, t, close }) {
      const snap = useStore(store);
      const data = snap.data;
      const problem = quotaProblem(data);
      const model = primaryModel(data?.quota);
      const now = Date.now();
      const head = React.createElement(
        "div",
        { className: "mmr_head" },
        React.createElement(
          "h2",
          { className: "mmr_title" },
          t("panel.title"),
          React.createElement("small", null, t("panel.subtitle"))
        ),
        React.createElement(
          "div",
          { className: "mmr_actions" },
          snap.at > 0 ? React.createElement(
            "span",
            { className: "mmr_stamp" },
            t("panel.stale") + " " + new Date(snap.at).toLocaleTimeString("zh-CN", { hour12: false })
          ) : null,
          React.createElement(
            "button",
            { type: "button", className: "mmr_ghost", onClick: () => store.refresh(), disabled: snap.status === "loading" },
            snap.status === "loading" ? t("panel.reading") : t("panel.refresh")
          ),
          React.createElement("button", { type: "button", className: "mmr_ghost", onClick: close }, t("back"))
        )
      );
      if (problem !== null) {
        return React.createElement(
          "div",
          { className: "mmr_dash mmr_root" },
          head,
          React.createElement(
            "div",
            { className: "mmr_state" },
            React.createElement("b", null, problem === "unconfigured" ? t("state.unconfigured") : t("state.error")),
            React.createElement("span", null, String(problem === "unconfigured" ? "\u5728 \u8BBE\u7F6E \u2192 \u6A21\u578B \u91CC\u586B\u5165 MINIMAX_CN_API_KEY\uFF08\u8BA2\u9605 Key\uFF09\u3002" : problem))
          ),
          React.createElement("div", { className: "mmr_note" }, t("note.source"))
        );
      }
      const usage = data?.usage;
      const today = usage?.today ?? {};
      const totals = usage?.totals ?? {};
      const rings = React.createElement(
        "div",
        { className: "mmr_rings" },
        React.createElement(Ring, {
          percent: model?.interval?.remaining,
          label: "5H",
          size: 150
        }),
        React.createElement(Ring, { percent: model?.weekly?.remaining, label: "7D", size: 104, small: true })
      );
      const resets = React.createElement(
        "div",
        { className: "mmr_resets" },
        React.createElement(
          "div",
          { className: "mmr_reset" },
          React.createElement("span", { className: "mmr_reset_k" }, t("ring.5h") + " \xB7 " + t("card.reset")),
          React.createElement("span", { className: "mmr_reset_v" }, countdown((model?.interval?.resetAt ?? 0) - now))
        ),
        React.createElement(
          "div",
          { className: "mmr_reset" },
          React.createElement("span", { className: "mmr_reset_k" }, t("ring.week") + " \xB7 " + t("card.reset")),
          React.createElement("span", { className: "mmr_reset_v" }, countdown((model?.weekly?.resetAt ?? 0) - now))
        ),
        React.createElement(
          "div",
          { className: "mmr_reset" },
          React.createElement("span", { className: "mmr_reset_k" }, "SITE"),
          React.createElement(
            "span",
            { className: "mmr_reset_v dim" },
            String(data?.quota?.region === "cn" ? "\u56FD\u5185\u7AD9" : data?.quota?.region === "global" ? "\u56FD\u9645\u7AD9" : "\u2014")
          )
        )
      );
      const metrics = React.createElement(
        "div",
        { className: "mmr_metrics" },
        React.createElement(
          "div",
          { className: "mmr_metric" },
          React.createElement("div", { className: "mmr_metric_k" }, t("metric.todayIn")),
          React.createElement(
            "div",
            { className: "mmr_metric_v" },
            fmtCompact(today.input),
            React.createElement("u", null, "tok")
          )
        ),
        React.createElement(
          "div",
          { className: "mmr_metric" },
          React.createElement("div", { className: "mmr_metric_k" }, t("metric.todayOut")),
          React.createElement(
            "div",
            { className: "mmr_metric_v" },
            fmtCompact(today.output),
            React.createElement("u", null, "tok")
          )
        ),
        React.createElement(
          "div",
          { className: "mmr_metric" },
          React.createElement("div", { className: "mmr_metric_k" }, t("metric.cacheHit")),
          React.createElement(
            "div",
            { className: "mmr_metric_v" },
            (() => {
              const denom = (today.input ?? 0) + (today.cacheRead ?? 0);
              return denom > 0 ? (Math.round((today.cacheRead ?? 0) / denom * 1e3) / 10).toFixed(1) : "\u2014";
            })(),
            React.createElement("u", null, "%")
          )
        ),
        React.createElement(
          "div",
          { className: "mmr_metric" },
          React.createElement("div", { className: "mmr_metric_k" }, t("metric.cost")),
          React.createElement("div", { className: "mmr_metric_v" }, fmtMoney(today.cost))
        )
      );
      const days = Array.isArray(usage?.days) ? usage.days.slice(-7) : [];
      const max = days.reduce((m, d) => Math.max(m, d.total ?? 0), 0);
      const chart = days.length === 0 ? React.createElement("div", { className: "mmr_empty" }, t("chart.empty")) : React.createElement(
        "div",
        { className: "mmr_chart" },
        days.map((d) => {
          const h = max > 0 ? Math.max(2, Math.round((d.total ?? 0) / max * 84)) : 2;
          const isToday = d.date === days[days.length - 1]?.date;
          return React.createElement(
            "div",
            { key: d.date, className: "mmr_bar" },
            React.createElement("span", { className: "mmr_bar_tip" }, d.date + " \xB7 " + fmtCompact(d.total)),
            React.createElement("span", {
              className: "mmr_bar_i" + (isToday ? "" : " b"),
              style: { height: h + "px" }
            }),
            React.createElement("span", { className: "mmr_bar_d" }, d.date.slice(5))
          );
        })
      );
      const models = Array.isArray(usage?.byModel) ? usage.byModel.slice(0, 6) : [];
      return React.createElement(
        "div",
        { className: "mmr_dash mmr_root" },
        head,
        React.createElement("div", { className: "mmr_grid" }, rings, resets),
        metrics,
        React.createElement(
          "div",
          { className: "mmr_lower" },
          React.createElement(
            "section",
            null,
            React.createElement(
              "div",
              { className: "mmr_sec_h" },
              React.createElement("span", null, t("chart.title")),
              React.createElement("span", null, fmtCompact(totals.total) + " tok \xB7 " + fmtInt(usage?.sessions ?? 0) + " sessions")
            ),
            chart
          ),
          React.createElement(
            "section",
            null,
            React.createElement("div", { className: "mmr_sec_h" }, React.createElement("span", null, t("models.title"))),
            React.createElement(
              "div",
              { className: "mmr_models" },
              models.length === 0 ? React.createElement("div", { className: "mmr_empty", style: { height: "auto", borderBottom: 0, padding: "10px 0", justifyItems: "start" } }, "\u2014") : models.map(
                (m) => React.createElement(
                  "div",
                  { key: m.model, className: "mmr_model" },
                  React.createElement("span", { className: "mmr_model_n", title: m.model }, m.model),
                  React.createElement("span", { className: "mmr_model_v" }, fmtCompact(m.total))
                )
              )
            )
          )
        ),
        React.createElement("div", { className: "mmr_note" }, t("note.source"))
      );
    }
    function apply(ctx) {
      const store = createStore();
      const locale = ctx.get("locale");
      if (locale !== void 0) {
        ctx.effect(() => locale.register(NS, { zh, en }), "minimax-radar: dictionaries");
      }
      const t = locale !== void 0 ? locale.bind(NS) : (key) => zh[key] ?? key;
      const open = () => {
        const layout = ctx.get("layout");
        if (layout !== void 0 && typeof layout.selectPanel === "function") {
          try {
            layout.selectPanel("minimax-radar");
          } catch {
          }
        }
      };
      const close = () => {
        const layout = ctx.get("layout");
        if (layout !== void 0 && typeof layout.selectPanel === "function") {
          try {
            layout.selectPanel(null);
          } catch {
          }
        }
      };
      ctx.effect(
        () => ctx.slots.inject(
          "sidebar.panellist",
          () => ctx.slots.register(
            {
              name: "sidebar.panellist",
              id: "minimax-radar",
              order: 20,
              label: () => t("entry.label"),
              locale: NS
            },
            RadarGlyph
          )
        ),
        "minimax-radar: sidebar entry"
      );
      ctx.effect(
        () => ctx.slots.inject(
          "main",
          () => ctx.slots.register(
            {
              name: "main",
              key: "minimax-radar",
              locale: NS,
              inject: () => ({ store, close })
            },
            Dashboard
          )
        ),
        "minimax-radar: dashboard"
      );
      ctx.effect(
        () => ctx.slots.inject(
          "sidebar.footer.action",
          () => ctx.slots.register(
            {
              name: "sidebar.footer.action",
              id: "minimax-radar-chip",
              order: 5,
              label: () => t("entry.label"),
              locale: NS,
              inject: () => ({ store, open })
            },
            SidebarCard
          )
        ),
        "minimax-radar: sidebar readout"
      );
    }
    return { inject: ["slots", "locale", "layout"], apply };
  }
});
