"use strict";
"use strict";
/**
 * Neumorphic Calendar Grid Card  v1.0
 * ───────────────────────────────────
 * A month-grid calendar card for Home Assistant.
 * Compatible with the Neumorphic theme (etnlbck/hacs-neumorphic-template).
 *
 * • Renders a full month grid with the current day highlighted.
 * • Navigate between months (prev / next / jump-to-today).
 * • Tap any date to load and display that day's events from one or more
 *   Home Assistant calendar entities.
 * • Fully self-contained — no external card dependencies.
 */
var _a;
const DARK_PALETTE = {
    bg: "#23272e",
    surface: "#23272e",
    shadowDark: "#181a1f",
    shadowLight: "#2c3140",
    textPrimary: "#e0e0e0",
    textMuted: "#888c94",
    textFaint: "#5a606c",
    gridLine: "rgba(255,255,255,0.05)",
};
const LIGHT_PALETTE = {
    bg: "#e7e5e4",
    surface: "#e7e5e4",
    shadowDark: "#c3c1c0",
    shadowLight: "#ffffff",
    textPrimary: "#1E2938",
    textMuted: "#6b7280",
    textFaint: "#a8a5a3",
    gridLine: "rgba(0,0,0,0.05)",
};
function resolveIsDark(hass) {
    var _a, _b, _c, _d;
    if (((_a = hass === null || hass === void 0 ? void 0 : hass.themes) === null || _a === void 0 ? void 0 : _a.darkMode) === true)
        return true;
    if (((_b = hass === null || hass === void 0 ? void 0 : hass.themes) === null || _b === void 0 ? void 0 : _b.darkMode) === false)
        return false;
    if (document.documentElement.classList.contains("dark"))
        return true;
    if (document.documentElement.classList.contains("light"))
        return false;
    const cssVar = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary-background-color").trim();
    if (cssVar) {
        const lum = hexLuminance(cssVar);
        if (lum !== null)
            return lum < 0.4;
    }
    return (_d = (_c = window.matchMedia) === null || _c === void 0 ? void 0 : _c.call(window, "(prefers-color-scheme: dark)").matches) !== null && _d !== void 0 ? _d : true;
}
function hexLuminance(hex) {
    const clean = hex.replace("#", "").trim();
    let r, g, b;
    if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    }
    else if (clean.length === 6) {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
    }
    else {
        return null;
    }
    if (isNaN(r) || isNaN(g) || isNaN(b))
        return null;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function hexAlpha(hex, alpha) {
    const clean = hex.replace("#", "").trim();
    let r, g, b;
    if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
    }
    else {
        r = parseInt(clean.slice(0, 2), 16);
        g = parseInt(clean.slice(2, 4), 16);
        b = parseInt(clean.slice(4, 6), 16);
    }
    return `rgba(${r},${g},${b},${alpha})`;
}
function labelVisible(cfg) {
    if (cfg === undefined)
        return true;
    return cfg.show !== false;
}
function applyTypography(el, cfg) {
    if (!cfg)
        return;
    if (cfg.font != null)
        el.style.fontFamily = cfg.font;
    if (cfg.size != null)
        el.style.fontSize = cfg.size;
    if (cfg.color != null)
        el.style.color = cfg.color;
    if (cfg.weight != null)
        el.style.fontWeight = String(cfg.weight);
    if (cfg.transform != null)
        el.style.textTransform = cfg.transform;
    if (cfg.spacing != null)
        el.style.letterSpacing = cfg.spacing;
}
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const WD_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WD_SUN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}
function isoWeek(d) {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = (t.getUTCDay() + 6) % 7;
    t.setUTCDate(t.getUTCDate() - dayNum + 3);
    const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
    const ftDay = (firstThu.getUTCDay() + 6) % 7;
    firstThu.setUTCDate(firstThu.getUTCDate() - ftDay + 3);
    return 1 + Math.round((t.getTime() - firstThu.getTime()) / (7 * 24 * 3600 * 1000));
}
class NeumorphicCalendarGridCard extends HTMLElement {
    constructor() {
        super(...arguments);
        this._hass = null;
        this._config = null;
        this._isDark = true;
        this._viewYear = 0;
        this._viewMonth = 0;
        this._selected = null;
        this._today = new Date();
        this._themeObserver = null;
        this._eventsByDay = new Map();
        this._fetchToken = 0;
    }
    connectedCallback() {
        this._today = new Date();
        if (this._viewYear === 0) {
            this._viewYear = this._today.getFullYear();
            this._viewMonth = this._today.getMonth();
        }
        this._isDark = resolveIsDark(this._hass);
        this._build();
        this._watchTheme();
        this._render();
        this._fetchMonthEvents();
    }
    disconnectedCallback() {
        var _a;
        (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        this._themeObserver = null;
    }
    setConfig(config) {
        var _a;
        const entities = (_a = config.entities) !== null && _a !== void 0 ? _a : (config.entity ? [config.entity] : []);
        this._config = Object.assign({
            first_day: "monday",
            card_size: 340,
            accent_color: "#006666",
            event_color: "#006666",
            show_week_numbers: false,
            show_agenda: true,
            display_only: false,
        }, config, { entities });
        if (this.shadowRoot) {
            this._updateStyle();
            this._render();
            this._fetchMonthEvents();
        }
    }
    set hass(hass) {
        const first = this._hass === null;
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        if (this.shadowRoot) {
            this._updateStyle();
            this._render();
            if (first)
                this._fetchMonthEvents();
        }
    }
    getCardSize() {
        var _a;
        return ((_a = this._config) === null || _a === void 0 ? void 0 : _a.show_agenda) === false ? 5 : 8;
    }
    get KS() {
        var _a, _b;
        return Math.max(260, Math.min(520, (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.card_size) !== null && _b !== void 0 ? _b : 340));
    }
    get SCALE() { return this.KS / 340; }
    _build() {
        if (this.shadowRoot)
            return;
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.id = "neu-style";
        this._updateStyle(style);
        const card = document.createElement("ha-card");
        card.id = "root";
        const header = document.createElement("div");
        header.className = "cal-header";
        header.innerHTML = `
      <div class="cal-title" id="cal-title"></div>
      <div class="cal-nav">
        <button class="nav-btn" id="nav-prev" aria-label="Previous month">${this._chevron("left")}</button>
        <button class="nav-btn nav-today" id="nav-today" aria-label="Jump to today">${this._dotIcon()}</button>
        <button class="nav-btn" id="nav-next" aria-label="Next month">${this._chevron("right")}</button>
      </div>`;
        const weekRow = document.createElement("div");
        weekRow.className = "weekday-row";
        weekRow.id = "weekday-row";
        const grid = document.createElement("div");
        grid.className = "cal-grid";
        grid.id = "cal-grid";
        const agenda = document.createElement("div");
        agenda.className = "agenda";
        agenda.id = "agenda";
        card.appendChild(header);
        card.appendChild(weekRow);
        card.appendChild(grid);
        card.appendChild(agenda);
        shadow.appendChild(style);
        shadow.appendChild(card);
        header.querySelector("#nav-prev").addEventListener("click", () => this._shiftMonth(-1));
        header.querySelector("#nav-next").addEventListener("click", () => this._shiftMonth(1));
        header.querySelector("#nav-today").addEventListener("click", () => this._goToday());
    }
    _chevron(dir) {
        const path = dir === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6";
        return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
      stroke-linejoin="round"><path d="${path}"/></svg>`;
    }
    _dotIcon() {
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="4.5"/></svg>`;
    }
    _updateStyle(styleEl) {
        var _a, _b, _c;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el)
            return;
        const p = this._isDark ? DARK_PALETTE : LIGHT_PALETTE;
        const cfg = this._config;
        const sc = this.SCALE;
        const ks = this.KS;
        const pad = Math.round(20 * sc);
        const cellR = Math.round(12 * sc);
        const gap = Math.round(6 * sc);
        const fsTitle = (15 * sc).toFixed(1);
        const fsWeekday = (10.5 * sc).toFixed(1);
        const fsDate = (14 * sc).toFixed(1);
        const fsAgenda = (12.5 * sc).toFixed(1);
        const navR = Math.round(34 * sc);
        const accent = (_b = cfg === null || cfg === void 0 ? void 0 : cfg.accent_color) !== null && _b !== void 0 ? _b : "#006666";
        const eventColor = (_c = cfg === null || cfg === void 0 ? void 0 : cfg.event_color) !== null && _c !== void 0 ? _c : accent;
        const noBorder = cfg === null || cfg === void 0 ? void 0 : cfg.no_border;
        const softOut = `${Math.round(5 * sc)}px ${Math.round(5 * sc)}px ${Math.round(11 * sc)}px ${p.shadowDark}, -${Math.round(5 * sc)}px -${Math.round(5 * sc)}px ${Math.round(11 * sc)}px ${p.shadowLight}`;
        const softIn = `inset ${Math.round(3 * sc)}px ${Math.round(3 * sc)}px ${Math.round(6 * sc)}px ${p.shadowDark}, inset -${Math.round(3 * sc)}px -${Math.round(3 * sc)}px ${Math.round(6 * sc)}px ${p.shadowLight}`;
        el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
      :host { display: block; }
      ha-card {
        display: flex;
        flex-direction: column;
        padding: ${pad}px;
        box-sizing: border-box;
        width: 100%;
        background:    ${noBorder ? "transparent" : `var(--ha-card-background, var(--card-background-color, ${p.bg}))`};
        border-radius: ${noBorder ? "0" : "var(--ha-card-border-radius, 20px)"};
        box-shadow:    ${noBorder ? "none" : `var(--ha-card-box-shadow, ${softOut})`};
        color: ${p.textPrimary};
        --neu-accent: ${accent};
        --neu-event: ${eventColor};
        --neu-surface: ${p.surface};
        --neu-shadow-dark: ${p.shadowDark};
        --neu-shadow-light: ${p.shadowLight};
      }
      .cal-header {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: ${Math.round(16 * sc)}px;
      }
      .cal-title {
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${fsTitle}px;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: ${p.textPrimary};
        white-space: nowrap;
      }
      .cal-title .cal-year { color: ${p.textMuted}; font-weight: 400; margin-left: 6px; }
      .cal-nav { display: flex; gap: ${Math.round(8 * sc)}px; }
      .nav-btn {
        width: ${navR}px; height: ${navR}px;
        display: flex; align-items: center; justify-content: center;
        border: none; border-radius: 50%;
        background: ${p.surface};
        color: ${p.textMuted};
        box-shadow: ${softOut};
        cursor: ${(cfg === null || cfg === void 0 ? void 0 : cfg.display_only) ? "default" : "pointer"};
        transition: box-shadow .12s ease, color .12s ease, transform .05s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .nav-btn:hover { color: ${p.textPrimary}; }
      .nav-btn:active { box-shadow: ${softIn}; transform: translateY(0.5px); }
      .nav-btn:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
      .nav-today { color: ${accent}; }
      ${(cfg === null || cfg === void 0 ? void 0 : cfg.display_only) ? ".nav-btn { pointer-events: none; }" : ""}
      .weekday-row {
        display: grid;
        grid-template-columns: ${(cfg === null || cfg === void 0 ? void 0 : cfg.show_week_numbers) ? `${Math.round(24 * sc)}px ` : ""}repeat(7, 1fr);
        gap: ${gap}px;
        margin-bottom: ${gap}px;
      }
      .weekday {
        text-align: center;
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${fsWeekday}px;
        font-weight: 600;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: ${p.textFaint};
        padding: ${Math.round(4 * sc)}px 0;
      }
      .wk-corner { }
      .cal-grid {
        display: grid;
        grid-template-columns: ${(cfg === null || cfg === void 0 ? void 0 : cfg.show_week_numbers) ? `${Math.round(24 * sc)}px ` : ""}repeat(7, 1fr);
        gap: ${gap}px;
      }
      .wk-num {
        display: flex; align-items: center; justify-content: center;
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${(9.5 * sc).toFixed(1)}px;
        color: ${p.textFaint};
      }
      .cell {
        position: relative;
        aspect-ratio: 1 / 1;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        border-radius: ${cellR}px;
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${fsDate}px;
        color: ${p.textPrimary};
        cursor: ${(cfg === null || cfg === void 0 ? void 0 : cfg.display_only) ? "default" : "pointer"};
        transition: box-shadow .12s ease, color .12s ease, background .12s ease;
        -webkit-tap-highlight-color: transparent;
        user-select: none;
      }
      ${(cfg === null || cfg === void 0 ? void 0 : cfg.display_only) ? ".cell { pointer-events: none; }" : ".cell:hover:not(.empty):not(.selected) { box-shadow: " + softOut + "; }"}
      .cell:focus-visible { outline: 2px solid ${accent}; outline-offset: 1px; }
      .cell.empty { color: ${p.textFaint}; opacity: 0.4; cursor: default; }
      .cell.other-month { color: ${p.textFaint}; opacity: 0.45; }
      .cell.today {
        color: ${accent};
        font-weight: 700;
        box-shadow: ${softIn};
      }
      .cell.selected {
        color: #fff;
        font-weight: 700;
        background: ${accent};
        box-shadow: ${softOut};
      }
      .cell.today.selected { color: #fff; }
      .cell .ev-dots {
        position: absolute;
        bottom: ${Math.round(6 * sc)}px;
        left: 0; right: 0;
        display: flex; justify-content: center; gap: ${Math.round(3 * sc)}px;
        height: ${Math.round(4 * sc)}px;
      }
      .cell .ev-dot {
        width: ${Math.round(4 * sc)}px; height: ${Math.round(4 * sc)}px;
        border-radius: 50%;
        background: ${eventColor};
      }
      .cell.selected .ev-dot { background: rgba(255,255,255,0.85); }
      .agenda {
        margin-top: ${Math.round(16 * sc)}px;
      }
      .agenda.hidden { display: none; }
      .agenda-title {
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${(11 * sc).toFixed(1)}px;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: ${p.textMuted};
        margin-bottom: ${Math.round(10 * sc)}px;
        padding-left: ${Math.round(2 * sc)}px;
      }
      .agenda-list { display: flex; flex-direction: column; gap: ${Math.round(8 * sc)}px; }
      .event {
        display: flex; align-items: flex-start; gap: ${Math.round(10 * sc)}px;
        padding: ${Math.round(11 * sc)}px ${Math.round(13 * sc)}px;
        border-radius: ${Math.round(12 * sc)}px;
        background: ${p.surface};
        box-shadow: ${softOut};
      }
      .event .ev-bar {
        width: ${Math.round(3 * sc)}px;
        align-self: stretch;
        border-radius: 3px;
        background: ${eventColor};
        flex-shrink: 0;
      }
      .event .ev-body { flex: 1; min-width: 0; }
      .event .ev-summary {
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${fsAgenda}px;
        font-weight: 500;
        color: ${p.textPrimary};
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .event .ev-time {
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${(10.5 * sc).toFixed(1)}px;
        color: ${p.textMuted};
        margin-top: ${Math.round(2 * sc)}px;
      }
      .event .ev-loc {
        font-size: ${(10 * sc).toFixed(1)}px;
        color: ${p.textFaint};
        margin-top: ${Math.round(2 * sc)}px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .agenda-empty {
        font-family: var(--primary-font-family, "Space Mono", monospace);
        font-size: ${fsAgenda}px;
        color: ${p.textFaint};
        padding: ${Math.round(14 * sc)}px ${Math.round(4 * sc)}px;
        text-align: center;
      }
      .agenda-loading {
        font-size: ${fsAgenda}px;
        color: ${p.textFaint};
        padding: ${Math.round(14 * sc)}px ${Math.round(4 * sc)}px;
        text-align: center;
      }
    `;
    }
    _watchTheme() {
        var _a;
        this._themeObserver = new MutationObserver(() => {
            const wasDark = this._isDark;
            this._isDark = resolveIsDark(this._hass);
            if (this._isDark !== wasDark) {
                this._updateStyle();
                this._render();
            }
        });
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });
        (_a = window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, "(prefers-color-scheme: dark)").addEventListener("change", () => {
            this._isDark = resolveIsDark(this._hass);
            this._updateStyle();
            this._render();
        });
    }
    _shiftMonth(delta) {
        var _a;
        if ((_a = this._config) === null || _a === void 0 ? void 0 : _a.display_only)
            return;
        let m = this._viewMonth + delta;
        let y = this._viewYear;
        while (m < 0) {
            m += 12;
            y -= 1;
        }
        while (m > 11) {
            m -= 12;
            y += 1;
        }
        this._viewMonth = m;
        this._viewYear = y;
        this._render();
        this._fetchMonthEvents();
    }
    _goToday() {
        var _a;
        if ((_a = this._config) === null || _a === void 0 ? void 0 : _a.display_only)
            return;
        this._today = new Date();
        this._viewYear = this._today.getFullYear();
        this._viewMonth = this._today.getMonth();
        this._selected = new Date(this._today);
        this._render();
        this._fetchMonthEvents();
    }
    _selectDate(d) {
        var _a;
        if ((_a = this._config) === null || _a === void 0 ? void 0 : _a.display_only)
            return;
        this._selected = d;
        this._render();
    }
    async _fetchMonthEvents() {
        var _a, _b, _c, _d, _e, _f;
        if (!this._hass || !this._config)
            return;
        const entities = (_a = this._config.entities) !== null && _a !== void 0 ? _a : [];
        if (entities.length === 0) {
            this._eventsByDay = new Map();
            this._renderAgenda();
            return;
        }
        const monthStart = new Date(this._viewYear, this._viewMonth, 1);
        const startOffset = this._leadingBlanks(monthStart);
        const rangeStart = new Date(this._viewYear, this._viewMonth, 1 - startOffset);
        const rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeEnd.getDate() + 42);
        const token = ++this._fetchToken;
        const startISO = rangeStart.toISOString();
        const endISO = rangeEnd.toISOString();
        const byDay = new Map();
        try {
            const results = await Promise.all(entities.map(async (ent) => {
                try {
                    const evs = await this._hass.callApi("GET", `calendars/${ent}?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`);
                    return (evs || []).map((e) => (Object.assign(Object.assign({}, e), { _entity: ent })));
                }
                catch (_a) {
                    return [];
                }
            }));
            if (token !== this._fetchToken)
                return;
            for (const list of results) {
                for (const ev of list) {
                    const startStr = (_c = (_b = ev.start) === null || _b === void 0 ? void 0 : _b.dateTime) !== null && _c !== void 0 ? _c : (_d = ev.start) === null || _d === void 0 ? void 0 : _d.date;
                    if (!startStr)
                        continue;
                    const isAllDay = !!((_e = ev.start) === null || _e === void 0 ? void 0 : _e.date) && !((_f = ev.start) === null || _f === void 0 ? void 0 : _f.dateTime);
                    const d = new Date(startStr);
                    const key = isAllDay
                        ? ev.start.date
                        : ymd(d);
                    if (!byDay.has(key))
                        byDay.set(key, []);
                    byDay.get(key).push(ev);
                }
            }
            for (const list of byDay.values()) {
                list.sort((a, b) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    const as = (_d = (_b = (_a = a.start) === null || _a === void 0 ? void 0 : _a.dateTime) !== null && _b !== void 0 ? _b : (_c = a.start) === null || _c === void 0 ? void 0 : _c.date) !== null && _d !== void 0 ? _d : "";
                    const bs = (_h = (_f = (_e = b.start) === null || _e === void 0 ? void 0 : _e.dateTime) !== null && _f !== void 0 ? _f : (_g = b.start) === null || _g === void 0 ? void 0 : _g.date) !== null && _h !== void 0 ? _h : "";
                    return as < bs ? -1 : as > bs ? 1 : 0;
                });
            }
            this._eventsByDay = byDay;
            this._renderDots();
            this._renderAgenda();
        }
        catch (_g) {
            if (token === this._fetchToken) {
                this._eventsByDay = new Map();
                this._renderAgenda();
            }
        }
    }
    _leadingBlanks(monthStart) {
        var _a;
        const dow = monthStart.getDay();
        if (((_a = this._config) === null || _a === void 0 ? void 0 : _a.first_day) === "sunday")
            return dow;
        return (dow + 6) % 7;
    }
    _render() {
        var _a, _b;
        if (!this.shadowRoot || !this._config)
            return;
        const sr = this.shadowRoot;
        const p = this._isDark ? DARK_PALETTE : LIGHT_PALETTE;
        const titleEl = sr.getElementById("cal-title");
        if (titleEl) {
            const vis = labelVisible(this._config.title_label);
            titleEl.style.display = vis ? "" : "none";
            if (vis) {
                const custom = (_b = (_a = this._config.title_label) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : this._config.title;
                if (custom) {
                    titleEl.textContent = custom;
                }
                else {
                    titleEl.innerHTML = `${MONTHS[this._viewMonth]}<span class="cal-year">${this._viewYear}</span>`;
                }
                applyTypography(titleEl, this._config.title_label);
            }
        }
        const weekRow = sr.getElementById("weekday-row");
        if (weekRow) {
            const names = this._config.first_day === "sunday" ? WD_SUN : WD_MON;
            let html = this._config.show_week_numbers ? `<div class="weekday wk-corner"></div>` : "";
            html += names.map((n) => `<div class="weekday">${n}</div>`).join("");
            weekRow.innerHTML = html;
            const wds = weekRow.querySelectorAll(".weekday");
            wds.forEach((el) => { if (this._config.weekday_label)
                applyTypography(el, this._config.weekday_label); });
        }
        this._renderGrid();
        this._renderAgenda();
    }
    _renderGrid() {
        if (!this.shadowRoot || !this._config)
            return;
        const grid = this.shadowRoot.getElementById("cal-grid");
        if (!grid)
            return;
        grid.innerHTML = "";
        const monthStart = new Date(this._viewYear, this._viewMonth, 1);
        const blanks = this._leadingBlanks(monthStart);
        const firstCell = new Date(this._viewYear, this._viewMonth, 1 - blanks);
        const showWk = this._config.show_week_numbers;
        for (let row = 0; row < 6; row++) {
            if (showWk) {
                const wkDate = new Date(firstCell);
                wkDate.setDate(wkDate.getDate() + row * 7);
                const wkEl = document.createElement("div");
                wkEl.className = "wk-num";
                wkEl.textContent = String(isoWeek(wkDate));
                grid.appendChild(wkEl);
            }
            for (let col = 0; col < 7; col++) {
                const idx = row * 7 + col;
                const d = new Date(firstCell);
                d.setDate(d.getDate() + idx);
                const inMonth = d.getMonth() === this._viewMonth;
                const cell = document.createElement("div");
                cell.className = "cell";
                cell.setAttribute("role", "button");
                cell.setAttribute("tabindex", this._config.display_only ? "-1" : "0");
                cell.setAttribute("aria-label", d.toDateString());
                if (!inMonth)
                    cell.classList.add("other-month");
                if (sameDay(d, this._today))
                    cell.classList.add("today");
                if (this._selected && sameDay(d, this._selected))
                    cell.classList.add("selected");
                const num = document.createElement("span");
                num.className = "date-num";
                num.textContent = String(d.getDate());
                if (this._config.date_label)
                    applyTypography(num, this._config.date_label);
                cell.appendChild(num);
                const key = ymd(d);
                const evs = this._eventsByDay.get(key);
                if (evs && evs.length) {
                    const dots = document.createElement("div");
                    dots.className = "ev-dots";
                    const n = Math.min(3, evs.length);
                    for (let i = 0; i < n; i++) {
                        const dot = document.createElement("span");
                        dot.className = "ev-dot";
                        dots.appendChild(dot);
                    }
                    cell.appendChild(dots);
                }
                const clickDate = new Date(d);
                cell.addEventListener("click", () => this._selectDate(clickDate));
                cell.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        this._selectDate(clickDate);
                    }
                });
                grid.appendChild(cell);
            }
        }
    }
    _renderDots() {
        this._renderGrid();
    }
    _renderAgenda() {
        var _a, _b, _c;
        if (!this.shadowRoot || !this._config)
            return;
        const agenda = this.shadowRoot.getElementById("agenda");
        if (!agenda)
            return;
        if (this._config.show_agenda === false) {
            agenda.classList.add("hidden");
            return;
        }
        agenda.classList.remove("hidden");
        const sel = this._selected;
        if (!sel) {
            agenda.innerHTML = `<div class="agenda-empty">Select a day to see events</div>`;
            return;
        }
        const heading = sel.toLocaleDateString(undefined, {
            weekday: "long", month: "long", day: "numeric",
        });
        const custom = (_a = this._config.agenda_label) === null || _a === void 0 ? void 0 : _a.text;
        let html = `<div class="agenda-title" id="agenda-title">${custom !== null && custom !== void 0 ? custom : heading}</div>`;
        const key = ymd(sel);
        const evs = (_b = this._eventsByDay.get(key)) !== null && _b !== void 0 ? _b : [];
        if (evs.length === 0) {
            html += `<div class="agenda-empty">No events</div>`;
        }
        else {
            html += `<div class="agenda-list">`;
            for (const ev of evs) {
                const summary = this._escape((_c = ev.summary) !== null && _c !== void 0 ? _c : "(no title)");
                const timeStr = this._eventTimeString(ev);
                const loc = ev.location ? `<div class="ev-loc">${this._escape(ev.location)}</div>` : "";
                html += `<div class="event">
          <div class="ev-bar"></div>
          <div class="ev-body">
            <div class="ev-summary">${summary}</div>
            <div class="ev-time">${timeStr}</div>
            ${loc}
          </div>
        </div>`;
            }
            html += `</div>`;
        }
        agenda.innerHTML = html;
        const titleEl = agenda.querySelector("#agenda-title");
        if (titleEl && this._config.agenda_label)
            applyTypography(titleEl, this._config.agenda_label);
    }
    _eventTimeString(ev) {
        var _a, _b, _c, _d;
        const isAllDay = !!((_a = ev.start) === null || _a === void 0 ? void 0 : _a.date) && !((_b = ev.start) === null || _b === void 0 ? void 0 : _b.dateTime);
        if (isAllDay)
            return "All day";
        const s = (_c = ev.start) === null || _c === void 0 ? void 0 : _c.dateTime;
        const e = (_d = ev.end) === null || _d === void 0 ? void 0 : _d.dateTime;
        if (!s)
            return "";
        const opts = { hour: "numeric", minute: "2-digit" };
        const sStr = new Date(s).toLocaleTimeString(undefined, opts);
        if (!e)
            return sStr;
        const eStr = new Date(e).toLocaleTimeString(undefined, opts);
        return `${sStr} – ${eStr}`;
    }
    _escape(s) {
        return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
    static getStubConfig() {
        return {
            entities: ["calendar.personal"],
            first_day: "monday",
            card_size: 340,
            accent_color: "#006666",
            event_color: "#006666",
            show_week_numbers: false,
            show_agenda: true,
        };
    }
    static getConfigElement() {
        return document.createElement("neumorphic-calendar-grid-editor");
    }
}
const EDITOR_CSS = `
  :host { display:block; font-family:var(--paper-font-body1_-_font-family,sans-serif); }
  .sec-hdr {
    display:flex; align-items:center; gap:8px;
    font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
    color:var(--secondary-text-color,#8891a0);
    padding:14px 0 6px; border-bottom:1px solid var(--divider-color,rgba(0,0,0,.08));
    margin-bottom:10px; cursor:pointer; user-select:none;
  }
  .sec-hdr svg { flex-shrink:0; opacity:.55; transition:transform .18s ease; }
  .sec-hdr.collapsed svg { transform:rotate(-90deg); }
  .sec-body { margin-bottom:4px; }
  .sec-body.hidden { display:none; }
  label { display:block; font-size:12px; color:var(--secondary-text-color,#6b7280); margin-bottom:3px; font-weight:500; }
  input[type=text],input[type=number],select,textarea {
    width:100%; padding:8px 10px; border-radius:6px;
    border:1px solid var(--divider-color,#d1d5db);
    background:var(--card-background-color,#fff);
    color:var(--primary-text-color,#111);
    font-size:13px; box-sizing:border-box; font-family:inherit;
    transition:border-color .15s;
  }
  textarea { min-height:64px; resize:vertical; font-family:monospace; font-size:12px; }
  input:focus,select:focus,textarea:focus { outline:none; border-color:var(--primary-color,#006666); }
  .field { margin-bottom:8px; }
  .row2 { display:flex; gap:8px; margin-bottom:8px; }
  .row2 > * { flex:1; min-width:0; }
  .range-wrap { display:flex; align-items:center; gap:8px; }
  .range-wrap input[type=range] { flex:1; accent-color:var(--primary-color,#006666); }
  .range-val { font-size:12px; font-weight:700; color:var(--primary-color,#006666); min-width:44px; text-align:right; font-family:monospace; }
  .tog-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; margin-bottom:6px; }
  .tog-row label { margin:0; }
  .switch { position:relative; display:inline-block; width:36px; height:20px; flex-shrink:0; }
  .switch input { opacity:0; width:0; height:0; }
  .sw-track { position:absolute; cursor:pointer; inset:0; border-radius:20px; background:var(--divider-color,#ccc); transition:.2s; }
  .sw-track::before { content:""; position:absolute; height:14px; width:14px; left:3px; bottom:3px; border-radius:50%; background:#fff; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  input:checked + .sw-track { background:var(--primary-color,#006666); }
  input:checked + .sw-track::before { transform:translateX(16px); }
  .color-field { display:flex; align-items:center; gap:6px; }
  .color-swatch { width:32px; height:32px; border-radius:6px; flex-shrink:0; border:1px solid var(--divider-color,#d1d5db); cursor:pointer; position:relative; overflow:hidden; }
  .color-swatch input[type=color] { position:absolute; inset:-4px; width:calc(100% + 8px); height:calc(100% + 8px); opacity:0; cursor:pointer; padding:0; border:none; }
  .color-field input[type=text] { flex:1; font-family:monospace; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .font-hint { font-size:10px; color:var(--secondary-text-color,#8891a0); margin-top:2px; display:block; }
  ha-entity-picker { display:block; width:100%; margin-bottom:8px; }
`;
const FONT_PRESETS = [
    { v: "", l: "Default (theme)" }, { v: "Space Mono", l: "Space Mono" },
    { v: "JetBrains Mono", l: "JetBrains Mono" }, { v: "system-ui", l: "System UI" },
    { v: "Arial", l: "Arial" }, { v: "Georgia", l: "Georgia" }, { v: "Roboto", l: "Roboto" },
    { v: "Open Sans", l: "Open Sans" }, { v: "Lato", l: "Lato" }, { v: "Montserrat", l: "Montserrat" },
    { v: "Poppins", l: "Poppins" }, { v: "Inter", l: "Inter" }, { v: "Oswald", l: "Oswald" },
    { v: "Bebas Neue", l: "Bebas Neue" }, { v: "Outfit", l: "Outfit" }, { v: "Nunito", l: "Nunito" },
    { v: "Quicksand", l: "Quicksand" }, { v: "__custom__", l: "✏ Custom…" },
];
const WEB_SAFE = new Set(["", "system-ui", "Arial", "Georgia", "monospace", "serif", "sans-serif"]);
class NeumorphicCalendarGridCardEditor extends HTMLElement {
    constructor() {
        super(...arguments);
        this._hass = null;
        this._config = {};
        this._sections = {};
        this._built = false;
    }
    set hass(hass) {
        var _a;
        this._hass = hass;
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll("ha-entity-picker").forEach((el) => { el.hass = hass; });
    }
    setConfig(config) {
        this._config = Object.assign({}, config);
        if (!this._built) {
            this.attachShadow({ mode: "open" });
            this._built = true;
        }
        this._render();
    }
    _get(path, fb = "") {
        var _a;
        return (_a = path.split(".").reduce((o, k) => (o != null && typeof o === "object") ? o[k] : undefined, this._config)) !== null && _a !== void 0 ? _a : fb;
    }
    _set(path, value) {
        const parts = path.split(".");
        let cur = this._config;
        for (let i = 0; i < parts.length - 1; i++) {
            if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object")
                cur[parts[i]] = {};
            cur = cur[parts[i]];
        }
        cur[parts[parts.length - 1]] = value;
        this._fire();
    }
    _fire() {
        this.dispatchEvent(new CustomEvent("config-changed", {
            detail: { config: Object.assign({}, this._config) },
            bubbles: true, composed: true,
        }));
    }
    _loadFont(family) {
        if (!family || WEB_SAFE.has(family))
            return;
        const id = `gfont-${family.replace(/\s+/g, "-")}`;
        if (document.getElementById(id))
            return;
        const link = Object.assign(document.createElement("link"), {
            id, rel: "stylesheet",
            href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;900&display=swap`,
        });
        document.head.appendChild(link);
    }
    _toggleSection(id) {
        var _a, _b;
        this._sections[id] = !this._sections[id];
        (_a = this.shadowRoot.querySelector(`[data-sec="${id}"]`)) === null || _a === void 0 ? void 0 : _a.classList.toggle("collapsed", !!this._sections[id]);
        (_b = this.shadowRoot.querySelector(`[data-secbody="${id}"]`)) === null || _b === void 0 ? void 0 : _b.classList.toggle("hidden", !!this._sections[id]);
    }
    _sec(id, title, body) {
        const c = !!this._sections[id];
        return `<div class="sec-hdr${c ? " collapsed" : ""}" data-sec="${id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      ${title}</div>
      <div class="sec-body${c ? " hidden" : ""}" data-secbody="${id}">${body}</div>`;
    }
    _text(path, lbl, ph = "") {
        return `<div class="field"><label>${lbl}</label>
      <input type="text" data-path="${path}" value="${String(this._get(path, "")).replace(/"/g, "&quot;")}" placeholder="${ph}">
    </div>`;
    }
    _range(path, lbl, min, max, step, suffix = "", def = min) {
        const v = Number(this._get(path, def));
        return `<div class="field"><label>${lbl}</label>
      <div class="range-wrap">
        <input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}">
        <span class="range-val" data-rv="${path}">${v}${suffix}</span>
      </div></div>`;
    }
    _select(path, lbl, opts) {
        const cur = String(this._get(path, opts[0].value));
        return `<div class="field"><label>${lbl}</label>
      <select data-path="${path}">${opts.map((o) => `<option value="${o.value}"${cur === o.value ? " selected" : ""}>${o.label}</option>`).join("")}</select>
    </div>`;
    }
    _toggle(path, lbl, def = false) {
        return `<div class="tog-row"><label>${lbl}</label>
      <label class="switch"><input type="checkbox" data-path="${path}"${Boolean(this._get(path, def)) ? " checked" : ""}><span class="sw-track"></span></label>
    </div>`;
    }
    _color(path, lbl, def = "#006666") {
        let raw = String(this._get(path, "") || def);
        if (!raw.startsWith("#"))
            raw = def;
        if (!/^#[0-9a-fA-F]{6}$/i.test(raw))
            raw = def;
        return `<div class="field"><label>${lbl}</label>
      <div class="color-field" data-colorpath="${path}">
        <div class="color-swatch" style="background:${raw}"><input type="color" value="${raw}"></div>
        <input type="text" class="color-hex" value="${raw.toUpperCase()}" placeholder="#RRGGBB" maxlength="7">
      </div></div>`;
    }
    _font(path, lbl) {
        const cur = String(this._get(path, ""));
        const isC = cur !== "" && !FONT_PRESETS.find((p) => p.v === cur && p.v !== "__custom__");
        const sel = isC ? "__custom__" : cur;
        return `<div class="field"><label>${lbl}</label>
      <select data-path="${path}" data-font-sel>
        ${FONT_PRESETS.map((p) => `<option value="${p.v}"${sel === p.v ? " selected" : ""}>${p.l}</option>`).join("")}
      </select>
      <input type="text" data-path="${path}" data-font-custom placeholder="e.g. Dancing Script"
        style="${isC ? "" : "display:none"}" value="${isC ? cur : ""}">
      <small class="font-hint">Google Fonts load automatically when selected.</small>
    </div>`;
    }
    _labelBlock(prefix, hasText = true) {
        return `
      ${this._toggle(`${prefix}.show`, "Visible", true)}
      ${hasText ? this._text(`${prefix}.text`, "Text override", "blank = auto") : ""}
      <div class="row2">
        ${this._text(`${prefix}.size`, "Size (e.g. 14px)", "14px")}
        ${this._select(`${prefix}.weight`, "Weight", [
            { value: "300", label: "300" }, { value: "400", label: "400" }, { value: "500", label: "500" },
            { value: "600", label: "600" }, { value: "700", label: "700" }, { value: "900", label: "900" },
        ])}
      </div>
      ${this._font(`${prefix}.font`, "Font family")}
      ${this._color(`${prefix}.color`, "Color", "#1E2938")}`;
    }
    _render() {
        var _a;
        const sr = this.shadowRoot;
        const entitiesVal = Array.isArray(this._config.entities)
            ? this._config.entities.join("\n")
            : ((_a = this._config.entity) !== null && _a !== void 0 ? _a : "");
        const html = `
    ${this._sec("entity", "📅 Calendar Entities", `
      <div class="field">
        <label>Calendar entities (one per line)</label>
        <textarea data-path="__entities__" placeholder="calendar.personal&#10;calendar.work">${String(entitiesVal).replace(/</g, "&lt;")}</textarea>
        <small class="font-hint">e.g. calendar.personal — add several to merge them.</small>
      </div>
    `)}
    ${this._sec("layout", "📐 Layout", `
      ${this._range("card_size", "Card width (px)", 260, 520, 10, "px", 340)}
      ${this._select("first_day", "Week starts on", [
            { value: "monday", label: "Monday" }, { value: "sunday", label: "Sunday" },
        ])}
      ${this._toggle("show_week_numbers", "Show week numbers")}
      ${this._toggle("show_agenda", "Show agenda panel", true)}
      ${this._toggle("no_border", "No border / transparent background")}
      ${this._toggle("display_only", "Display only — no interaction")}
    `)}
    ${this._sec("colors", "🎨 Colours", `
      ${this._color("accent_color", "Accent (today / selected)", "#006666")}
      ${this._color("event_color", "Event colour", "#006666")}
    `)}
    ${this._sec("title_lbl", "𝗔 Title Label", this._labelBlock("title_label", true))}
    ${this._sec("weekday_lbl", "ᴬ Weekday Labels", this._labelBlock("weekday_label", false))}
    ${this._sec("date_lbl", "# Date Numbers", this._labelBlock("date_label", false))}
    ${this._sec("agenda_lbl", "≡ Agenda Heading", this._labelBlock("agenda_label", true))}
    `;
        const style = document.createElement("style");
        style.textContent = EDITOR_CSS;
        const div = document.createElement("div");
        div.innerHTML = html;
        div.querySelectorAll('textarea[data-path="__entities__"]').forEach((el) => {
            el.addEventListener("change", () => {
                const arr = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
                this._config.entities = arr;
                delete this._config.entity;
                this._fire();
            });
        });
        div.querySelectorAll("input[type=text][data-path]:not(.color-hex):not([data-font-custom])").forEach((el) => {
            el.addEventListener("change", () => {
                let v = el.value;
                if (typeof v === "string" && el.dataset.path.endsWith(".size")) {
                    if (v !== "" && /^\d+(\.\d+)?$/.test(v))
                        v = v + "px";
                }
                this._set(el.dataset.path, v === "" ? undefined : v);
                this._render();
            });
        });
        div.querySelectorAll("select[data-path]").forEach((sel) => {
            sel.addEventListener("change", () => {
                if (sel.dataset.fontSel !== undefined) {
                    const ci = sel.nextElementSibling;
                    if (sel.value === "__custom__") {
                        ci.style.display = "";
                        ci.focus();
                        return;
                    }
                    if (ci)
                        ci.style.display = "none";
                    if (sel.value)
                        this._loadFont(sel.value);
                }
                this._set(sel.dataset.path, sel.value === "" ? undefined : sel.value);
                this._render();
            });
        });
        div.querySelectorAll("input[data-font-custom]").forEach((el) => {
            el.addEventListener("change", () => {
                if (el.value.trim())
                    this._loadFont(el.value.trim());
                this._set(el.dataset.path, el.value.trim() || undefined);
                this._render();
            });
        });
        div.querySelectorAll("input[type=checkbox][data-path]").forEach((el) => {
            el.addEventListener("change", () => { this._set(el.dataset.path, el.checked); this._render(); });
        });
        div.querySelectorAll("input[type=range][data-path]").forEach((el) => {
            el.addEventListener("input", () => {
                const rv = div.querySelector(`[data-rv="${el.dataset.path}"]`);
                if (rv)
                    rv.textContent = el.value + (el.dataset.suffix || "");
            });
            el.addEventListener("change", () => { this._set(el.dataset.path, Number(el.value)); this._render(); });
        });
        div.querySelectorAll(".color-field[data-colorpath]").forEach((field) => {
            const path = field.dataset.colorpath;
            const native = field.querySelector("input[type=color]");
            const swatch = field.querySelector(".color-swatch");
            const text = field.querySelector("input.color-hex");
            native.addEventListener("input", () => { swatch.style.background = native.value; text.value = native.value.toUpperCase(); });
            native.addEventListener("change", () => { this._set(path, native.value); this._render(); });
            text.addEventListener("input", () => {
                let v = text.value.trim();
                if (!v.startsWith("#"))
                    v = "#" + v;
                if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
                    swatch.style.background = v;
                    native.value = v;
                }
            });
            text.addEventListener("change", () => {
                let v = text.value.trim();
                if (!v.startsWith("#"))
                    v = "#" + v;
                if (/^#[0-9a-fA-F]{6}$/i.test(v)) {
                    this._set(path, v);
                    this._render();
                }
            });
        });
        div.querySelectorAll(".sec-hdr[data-sec]").forEach((el) => {
            el.addEventListener("click", () => this._toggleSection(el.dataset.sec));
        });
        sr.innerHTML = "";
        sr.appendChild(style);
        sr.appendChild(div);
    }
}
customElements.define("neumorphic-calendar-grid-editor", NeumorphicCalendarGridCardEditor);
customElements.define("neumorphic-calendar-grid-card", NeumorphicCalendarGridCard);
window.customCards = (_a = window.customCards) !== null && _a !== void 0 ? _a : [];
window.customCards.push({
    type: "neumorphic-calendar-grid-card",
    name: "Neumorphic Calendar Grid",
    description: "Month-grid calendar with today highlight, navigation, and tap-for-events — Neumorphic theme",
    preview: true,
});
