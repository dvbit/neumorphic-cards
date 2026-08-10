"use strict";
/**
 * Neumorphic Clock Card  v1.0
 * ───────────────────────────
 * A minimalist soft-UI analog clock for Home Assistant.
 * Displays a time entity (input_datetime / sensor / timestamp) with thin
 * rounded hands on a recessed neumorphic disc, no numerals — plus an optional
 * localized date caption. Design-system aligned (#E7E5E4 / #006666 / Space Mono).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  type: custom:neumorphic-clock-card                           │
 * │  entity: input_datetime.my_time     # time source (optional*) │
 * │  date_entity: input_datetime.my_date  # caption source (opt)  │
 * │  card_size: 300             # disc width px, 180–460           │
 * │  hand_color: "#2f47d6"      # hour + minute hands             │
 * │  seconds: false             # show the seconds hand           │
 * │  seconds_color: "#006666"   # seconds hand colour             │
 * │  show_ticks: false          # 12 hour tick marks              │
 * │  show_numerals: false       # 12 / 3 / 6 / 9 numerals         │
 * │  show_date: true            # date caption below the clock    │
 * │  date_format: long          # long | short | numeric | weekday│
 * │  smooth: false              # sweeping (vs ticking) motion     │
 * │  * omit entity for a live wall clock.                          │
 * └──────────────────────────────────────────────────────────────┘
 */
var _a;

const CK_LIGHT = {
    bg: "#E7E5E4", surface: "#E7E5E4",
    shadowDark: "#c5c3c2", shadowLight: "#ffffff",
    textPrimary: "#1E2938", textSecondary: "#6b7280", textFaint: "#a8a5a3",
    face: "#e9e7e6",
};
const CK_DARK = {
    bg: "#23272e", surface: "#23272e",
    shadowDark: "#181a1f", shadowLight: "#2c3140",
    textPrimary: "#e6e8ec", textSecondary: "#9aa0aa", textFaint: "#5a606c",
    face: "#242830",
};

function resolveIsDark(hass) {
    var _a, _b, _c, _d;
    if (((_a = hass === null || hass === void 0 ? void 0 : hass.themes) === null || _a === void 0 ? void 0 : _a.darkMode) === true) return true;
    if (((_b = hass === null || hass === void 0 ? void 0 : hass.themes) === null || _b === void 0 ? void 0 : _b.darkMode) === false) return false;
    if (document.documentElement.classList.contains("dark")) return true;
    if (document.documentElement.classList.contains("light")) return false;
    return (_d = (_c = window.matchMedia) === null || _c === void 0 ? void 0 : _c.call(window, "(prefers-color-scheme: dark)").matches) !== null && _d !== void 0 ? _d : true;
}
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

// ── Typography helpers ───────────────────────────────────────────────────────
function labelVisible(cfg) { return cfg === undefined ? true : cfg.show !== false; }
function applyTypography(el, cfg) {
    if (!cfg || !el) return;
    if (cfg.font) el.style.fontFamily = cfg.font;
    if (cfg.size) el.style.fontSize = cfg.size;
    if (cfg.color) el.style.color = cfg.color;
    if (cfg.weight) el.style.fontWeight = String(cfg.weight);
    if (cfg.transform) el.style.textTransform = cfg.transform;
    if (cfg.spacing) el.style.letterSpacing = cfg.spacing;
}
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

function localeFor(hass) {
    return (hass && (hass.language || (hass.locale && hass.locale.language))) || undefined;
}

class NeumorphicClockCard extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._config = null;
        this._rawConfig = null;
        this._isDark = true;
        this._hassReady = false;
        this._themeObserver = null;
        this._tick = null;
    }

    setConfig(config) {
        this._rawConfig = config;
        this._config = Object.assign({
            card_size: 300,
            face_style: "flat",
            hand_color: "#2f47d6",
            seconds: false,
            seconds_color: "#006666",
            show_ticks: false,
            show_numerals: false,
            show_date: true,
            date_format: "long",
            smooth: false,
        }, config);
        if (this.shadowRoot) { this._updateStyle(); this._render(); this._restartTick(); }
    }

    set hass(hass) {
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        if (!this._hassReady) {
            this._hassReady = true;
            this._build();
            this._watchTheme();
            this._restartTick();
        }
        if (this.shadowRoot) { this._updateStyle(); this._render(); }
    }

    getCardSize() { return 4; }
    static getStubConfig() { return { entity: "" }; }
    static getConfigElement() { return document.createElement("neumorphic-clock-editor"); }

    get KS() { var _a, _b; return clamp((_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.card_size) !== null && _b !== void 0 ? _b : 300, 180, 460); }
    get SCALE() { return this.KS / 300; }

    // ── Time source ─────────────────────────────────────────────────────────────
    // Returns a Date whose h/m/s reflect the entity (or live time if no entity).
    _resolveTime() {
        const s = this._stateObj;
        if (!s) return new Date();               // live wall clock
        const st = s.state;
        const at = s.attributes || {};
        // input_datetime with a unix timestamp attribute
        if (typeof at.timestamp === "number") {
            // timestamp is seconds since local midnight (time-only) or epoch (with date).
            if (at.has_date === false || (at.has_date === undefined && at.has_time)) {
                const d = new Date(); d.setHours(0, 0, 0, 0);
                return new Date(d.getTime() + at.timestamp * 1000);
            }
            // Could be epoch seconds
            if (at.timestamp > 1e6) return new Date(at.timestamp * 1000);
        }
        if (!st || st === "unknown" || st === "unavailable") return new Date();
        // ISO / datetime string
        if (/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(st)) {
            const d = new Date(st.replace(" ", "T"));
            if (!isNaN(d.getTime())) return d;
        }
        // Plain HH:MM or HH:MM:SS
        const m = st.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if (m) {
            const d = new Date(); d.setHours(Number(m[1]), Number(m[2]), Number(m[3] || 0), 0);
            return d;
        }
        // Timestamp-typed sensor (ISO already handled); last resort epoch number
        const n = Number(st);
        if (!isNaN(n) && n > 1e6) return new Date(n * (n > 1e12 ? 1 : 1000));
        return new Date();
    }
    get _stateObj() {
        var _a, _b;
        const ent = (_a = this._config) === null || _a === void 0 ? void 0 : _a.entity;
        return ent && ((_b = this._hass) === null || _b === void 0 ? void 0 : _b.states) ? this._hass.states[ent] : null;
    }
    _resolveDate() {
        // Priority: date_entity → time entity's date → today.
        const de = this._config.date_entity;
        if (de && this._hass && this._hass.states[de]) {
            const st = this._hass.states[de].state;
            const at = this._hass.states[de].attributes || {};
            if (typeof at.timestamp === "number" && at.timestamp > 1e6) return new Date(at.timestamp * 1000);
            const d = new Date(st.replace(" ", "T"));
            if (!isNaN(d.getTime())) return d;
        }
        const s = this._stateObj;
        if (s && /\d{4}-\d{2}-\d{2}/.test(s.state)) {
            const d = new Date(s.state.replace(" ", "T"));
            if (!isNaN(d.getTime())) return d;
        }
        return new Date();
    }

    _restartTick() {
        if (this._tick) { clearInterval(this._tick); this._tick = null; }
        // Tick every second if seconds hand or smooth; else every 15s is enough for minute accuracy.
        const period = (this._config && (this._config.seconds || this._config.smooth)) ? 1000 : 10000;
        this._tick = setInterval(() => this._renderHands(), period);
    }
    disconnectedCallback() {
        var _a;
        (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        if (this._tick) { clearInterval(this._tick); this._tick = null; }
    }

    // ── DOM ─────────────────────────────────────────────────────────────────────
    _build() {
        if (this.shadowRoot) return;
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.id = "neu-style";
        const card = document.createElement("ha-card");
        card.id = "root";
        card.innerHTML = `
      <div class="clock-wrap" id="clock-wrap"></div>
      <div class="date-cap" id="date-cap"></div>`;
        shadow.appendChild(style);
        shadow.appendChild(card);
        this._updateStyle(style);
    }

    _updateStyle(styleEl) {
        var _a;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el) return;
        const p = this._isDark ? CK_DARK : CK_LIGHT;
        const cfg = this._config || {};
        const sc = this.SCALE;
        const pad = Math.round(22 * sc);
        const softOut = `${Math.round(7 * sc)}px ${Math.round(7 * sc)}px ${Math.round(16 * sc)}px ${p.shadowDark}, -${Math.round(7 * sc)}px -${Math.round(7 * sc)}px ${Math.round(16 * sc)}px ${p.shadowLight}`;
        el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
      :host { display:block; }
      ha-card {
        display:flex; flex-direction:column; align-items:center;
        padding:${pad}px; box-sizing:border-box; width:100%;
        background:${cfg.no_border ? "transparent" : `var(--ha-card-background, var(--card-background-color, ${p.bg}))`};
        border-radius:${cfg.no_border ? "0" : "var(--ha-card-border-radius, 26px)"};
        box-shadow:${cfg.no_border ? "none" : `var(--ha-card-box-shadow, ${softOut})`};
        color:${p.textPrimary};
        font-family:var(--primary-font-family,'Space Mono',monospace);
      }
      .clock-wrap { width:100%; display:flex; align-items:center; justify-content:center; }
      .clock-wrap svg { width:100%; height:auto; max-width:${this.KS}px; display:block; overflow:visible; }
      .date-cap { margin-top:${Math.round(18 * sc)}px; font-size:${Math.round(15 * sc)}px; font-weight:700; color:${p.textPrimary}; letter-spacing:0.01em; text-align:center; }
      .date-cap.hidden { display:none; }
      .hand { transition:${cfg.smooth ? "none" : `transform .18s cubic-bezier(.4,2.2,.5,1)`}; transform-box:fill-box; }
    `;
    }

    _watchTheme() {
        var _a;
        this._themeObserver = new MutationObserver(() => {
            const was = this._isDark;
            this._isDark = resolveIsDark(this._hass);
            if (this._isDark !== was) { this._updateStyle(); this._render(); }
        });
        this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
        (_a = window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, "(prefers-color-scheme: dark)").addEventListener("change", () => {
            this._isDark = resolveIsDark(this._hass); this._updateStyle(); this._render();
        });
    }

    // ── Render ────────────────────────────────────────────────────────────────
    _render() {
        if (!this.shadowRoot || !this._config) return;
        this._renderFace();
        this._renderHands();
        this._renderDate();
    }

    _renderFace() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("clock-wrap");
        if (!wrap) return;
        const p = this._isDark ? CK_DARK : CK_LIGHT;
        const cfg = this._config;
        const S = 300, c = S / 2, r = 128;
        const uid = "nck";
        let ticks = "";
        if (cfg.show_ticks) {
            for (let i = 0; i < 12; i++) {
                const ang = (i / 12) * 2 * Math.PI;
                const rOuter = r - 10, rInner = i % 3 === 0 ? r - 24 : r - 18;
                const x1 = c + rOuter * Math.sin(ang), y1 = c - rOuter * Math.cos(ang);
                const x2 = c + rInner * Math.sin(ang), y2 = c - rInner * Math.cos(ang);
                const tickCol = cfg.face_style === "bowl" ? (this._isDark ? "#6a6f78" : "#9aa0aa") : p.textFaint;
                ticks += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${tickCol}" stroke-width="${i % 3 === 0 ? 3 : 1.6}" stroke-linecap="round" opacity="0.7"/>`;
            }
        }
        let numerals = "";
        if (cfg.show_numerals) {
            [[12, 0], [3, 90], [6, 180], [9, 270]].forEach(([n, deg]) => {
                const ang = (deg / 180) * Math.PI, rr = r - 30;
                const x = c + rr * Math.sin(ang), y = c - rr * Math.cos(ang);
                const numCol = cfg.face_style === "bowl" ? (this._isDark ? "#c2c6cd" : "#7a8089") : p.textSecondary;
                numerals += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-family="var(--primary-font-family,'Space Mono',monospace)" font-size="18" font-weight="700" fill="${numCol}">${n}</text>`;
            });
        }

        const discSvg = cfg.face_style === "bowl"
            ? this._bowlFace(S, c, r, uid, p)
            : this._flatFace(S, c, r, uid, p);

        wrap.innerHTML = `
      <svg viewBox="0 0 ${S} ${S}" role="img" aria-label="clock">
        ${discSvg.defs}
        ${discSvg.body}
        ${ticks}
        ${numerals}
        <g id="hands-g"></g>
      </svg>`;
    }

    _flatFace(S, c, r, uid, p) {
        return {
            defs: `<defs>
          <radialGradient id="${uid}-face" cx="42%" cy="38%" r="75%">
            <stop offset="0%" stop-color="${p.shadowLight}" stop-opacity="0.55"/>
            <stop offset="60%" stop-color="${p.face}"/>
            <stop offset="100%" stop-color="${p.face}"/>
          </radialGradient>
          <filter id="${uid}-in" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="6" dy="6" stdDeviation="10" flood-color="${p.shadowDark}" flood-opacity="0.55"/>
            <feDropShadow dx="-6" dy="-6" stdDeviation="10" flood-color="${p.shadowLight}" flood-opacity="0.9"/>
          </filter>
          <filter id="${uid}-hand" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="${p.shadowDark}" flood-opacity="0.5"/>
          </filter>
        </defs>`,
            body: `<circle cx="${c}" cy="${c}" r="${r + 6}" fill="${p.surface}"
          style="filter:drop-shadow(7px 7px 16px ${p.shadowDark}) drop-shadow(-7px -7px 16px ${p.shadowLight})"/>
        <circle cx="${c}" cy="${c}" r="${r}" fill="url(#${uid}-face)"/>
        <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${p.shadowDark}" stroke-opacity="0.25" stroke-width="2" filter="url(#${uid}-in)"/>`,
        };
    }

    // Deep concave bowl: raised outer rim, dark recessed ring, softly-lit interior,
    // all heavily diffused for the organic, carved look.
    _bowlFace(S, c, r, uid, p) {
        const dark = this._isDark;
        // Bowl palette (independent of card bg so it reads dimensional on any surface).
        const rimHi = dark ? "#3a3f47" : "#f2f0ef";
        const rimBase = dark ? "#2b2f36" : "#e4e2e1";
        const ringDark = dark ? "#141619" : "#b9b6b4";   // the recessed shadow ring
        const bowlEdge = dark ? "#202329" : "#cfcdcc";
        const bowlCenter = dark ? "#33383f" : "#eceae9";  // lit interior floor
        const litHi = dark ? "#454b54" : "#fbfbfa";
        return {
            defs: `<defs>
          <!-- raised outer rim: light from top-left -->
          <radialGradient id="${uid}-rim" cx="40%" cy="34%" r="70%">
            <stop offset="0%" stop-color="${rimHi}"/>
            <stop offset="70%" stop-color="${rimBase}"/>
            <stop offset="100%" stop-color="${dark ? "#23262c" : "#dad8d7"}"/>
          </radialGradient>
          <!-- concave interior: dark at the edge (shadow ring), lit toward centre-bottom -->
          <radialGradient id="${uid}-bowl" cx="50%" cy="46%" r="58%">
            <stop offset="0%" stop-color="${bowlCenter}"/>
            <stop offset="55%" stop-color="${bowlCenter}"/>
            <stop offset="82%" stop-color="${bowlEdge}"/>
            <stop offset="100%" stop-color="${ringDark}"/>
          </radialGradient>
          <!-- soft top highlight crescent inside the bowl -->
          <radialGradient id="${uid}-lit" cx="50%" cy="72%" r="46%">
            <stop offset="0%" stop-color="${litHi}" stop-opacity="${dark ? 0.5 : 0.7}"/>
            <stop offset="70%" stop-color="${litHi}" stop-opacity="0"/>
            <stop offset="100%" stop-color="${litHi}" stop-opacity="0"/>
          </radialGradient>
          <filter id="${uid}-soft" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7"/>
          </filter>
          <filter id="${uid}-soft2" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="12"/>
          </filter>
          <filter id="${uid}-hand" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="1" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="${dark ? 0.45 : 0.3}"/>
          </filter>
        </defs>`,
            body: `
        <!-- raised rim (whole face) -->
        <circle cx="${c}" cy="${c}" r="${r + 8}" fill="url(#${uid}-rim)"/>
        <!-- dark recessed shadow ring, blurred, sitting under the rim's inner edge -->
        <circle cx="${c}" cy="${c + 3}" r="${r - 2}" fill="none" stroke="${ringDark}" stroke-width="16" opacity="${dark ? 0.9 : 0.55}" filter="url(#${uid}-soft2)"/>
        <!-- concave interior -->
        <circle cx="${c}" cy="${c}" r="${r - 6}" fill="url(#${uid}-bowl)" filter="url(#${uid}-soft)"/>
        <!-- lit crescent toward the bottom of the bowl -->
        <circle cx="${c}" cy="${c}" r="${r - 10}" fill="url(#${uid}-lit)" filter="url(#${uid}-soft)"/>
        <!-- faint top inner shadow to deepen the concavity -->
        <ellipse cx="${c}" cy="${c - r * 0.42}" rx="${r * 0.62}" ry="${r * 0.34}" fill="${ringDark}" opacity="${dark ? 0.5 : 0.28}" filter="url(#${uid}-soft2)"/>`,
        };
    }

    _renderHands() {
        const sr = this.shadowRoot;
        if (!sr) return;
        const g = sr.getElementById("hands-g");
        if (!g) return;
        const cfg = this._config;
        const p = this._isDark ? CK_DARK : CK_LIGHT;
        const S = 300, c = S / 2;
        const t = this._resolveTime();
        const ms = t.getMilliseconds();
        const sec = t.getSeconds() + (cfg.smooth ? ms / 1000 : 0);
        const min = t.getMinutes() + sec / 60;
        const hr = (t.getHours() % 12) + min / 60;

        const hourAng = hr * 30;      // 360/12
        const minAng = min * 6;       // 360/60
        const secAng = sec * 6;

        const handColor = cfg.hand_color || "#2f47d6";
        const secColor = cfg.seconds_color || "#006666";

        // Hand geometry (from centre). Rounded line caps, no tail (matches the reference).
        const hand = (ang, len, w, color, back) => {
            const a = (ang - 90) * Math.PI / 180;
            const x2 = c + len * Math.cos(a), y2 = c + len * Math.sin(a);
            const x1 = c - (back || 0) * Math.cos(a), y1 = c - (back || 0) * Math.sin(a);
            return `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round" filter="url(#nck-hand)"/>`;
        };
        let html = "";
        html += hand(hourAng, 58, 6.5, handColor, 0);
        html += hand(minAng, 92, 5, handColor, 0);
        if (cfg.seconds) html += hand(secAng, 100, 2, secColor, 22);
        // tiny centre cap
        html += `<circle cx="${c}" cy="${c}" r="4.5" fill="${handColor}"/>`;
        if (cfg.seconds) html += `<circle cx="${c}" cy="${c}" r="2.2" fill="${secColor}"/>`;
        g.innerHTML = html;
    }

    _renderDate() {
        const sr = this.shadowRoot;
        const cap = sr.getElementById("date-cap");
        if (!cap) return;
        const cfg = this._config;
        if (cfg.show_date === false || !labelVisible(cfg.date_label)) { cap.className = "date-cap hidden"; cap.textContent = ""; return; }
        cap.className = "date-cap";
        const custom = cfg.date_label && cfg.date_label.text;
        if (custom) { cap.textContent = custom; applyTypography(cap, cfg.date_label); return; }
        const d = this._resolveDate();
        const loc = localeFor(this._hass);
        let opts;
        switch (cfg.date_format) {
            case "short": opts = { weekday: "short", month: "short", day: "numeric" }; break;
            case "numeric": opts = { year: "numeric", month: "2-digit", day: "2-digit" }; break;
            case "weekday": opts = { weekday: "long" }; break;
            default: opts = { weekday: "long", month: "long", day: "numeric" };
        }
        let text;
        try { text = new Intl.DateTimeFormat(loc, opts).format(d); }
        catch (_a) { text = d.toDateString(); }
        cap.textContent = text;
        applyTypography(cap, cfg.date_label);
    }
}

// ── Editor ────────────────────────────────────────────────────────────────────
const CLOCK_EDITOR_CSS = `
  :host { display:block; font-family:var(--paper-font-body1_-_font-family,sans-serif); }
  .sec-hdr { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--secondary-text-color,#8891a0); padding:14px 0 6px; border-bottom:1px solid var(--divider-color,rgba(0,0,0,.08)); margin-bottom:10px; cursor:pointer; user-select:none; }
  .sec-hdr svg { flex-shrink:0; opacity:.55; transition:transform .18s ease; }
  .sec-hdr.collapsed svg { transform:rotate(-90deg); }
  .sec-body.hidden { display:none; }
  label { display:block; font-size:12px; color:var(--secondary-text-color,#6b7280); margin-bottom:3px; font-weight:500; }
  input[type=text],input[type=number],select { width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--divider-color,#d1d5db); background:var(--card-background-color,#fff); color:var(--primary-text-color,#111); font-size:13px; box-sizing:border-box; font-family:inherit; }
  input:focus,select:focus { outline:none; border-color:var(--primary-color,#006666); }
  .field { margin-bottom:8px; }
  .row2 { display:flex; gap:8px; margin-bottom:8px; } .row2 > * { flex:1; min-width:0; }
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
  .color-field input[type=text] { flex:1; font-family:monospace; font-size:12px; text-transform:uppercase; }
  .font-hint { font-size:10px; color:var(--secondary-text-color,#8891a0); margin-top:2px; display:block; }
  ha-entity-picker { display:block; width:100%; margin-bottom:8px; }
`;

class NeumorphicClockCardEditor extends HTMLElement {
    constructor() { super(); this._hass = null; this._config = {}; this._sections = {}; this._built = false; }
    set hass(hass) { this._hass = hass; this.shadowRoot && this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((el) => { el.hass = hass; }); }
    setConfig(config) { this._config = Object.assign({}, config); if (!this._built) { this.attachShadow({ mode: "open" }); this._built = true; } this._render(); }
    _get(path, fb = "") { const v = path.split(".").reduce((o, k) => (o != null && typeof o === "object") ? o[k] : undefined, this._config); return v !== undefined && v !== null ? v : fb; }
    _set(path, value) {
        const parts = path.split("."); let cur = this._config;
        for (let i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {}; cur = cur[parts[i]]; }
        if (value === "" || value === undefined || value === null) delete cur[parts[parts.length - 1]]; else cur[parts[parts.length - 1]] = value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: Object.assign({}, this._config) }, bubbles: true, composed: true }));
    }
    _loadFont(family) { if (!family || WEB_SAFE.has(family)) return; const id = `gfont-${family.replace(/\s+/g, "-")}`; if (document.getElementById(id)) return; const link = Object.assign(document.createElement("link"), { id, rel: "stylesheet", href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;900&display=swap` }); document.head.appendChild(link); }
    _toggleSection(id) { this._sections[id] = !this._sections[id]; const h = this.shadowRoot.querySelector(`[data-sec="${id}"]`); const b = this.shadowRoot.querySelector(`[data-secbody="${id}"]`); if (h) h.classList.toggle("collapsed", !!this._sections[id]); if (b) b.classList.toggle("hidden", !!this._sections[id]); }
    _sec(id, title, body) { const c = !!this._sections[id]; return `<div class="sec-hdr${c ? " collapsed" : ""}" data-sec="${id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>${title}</div><div class="sec-body${c ? " hidden" : ""}" data-secbody="${id}">${body}</div>`; }
    _entityPicker(path, domains, ph) {
        const v = this._get(path);
        if (customElements.get("ha-entity-picker")) { const inc = domains ? ` include-domains='${JSON.stringify(domains)}'` : ""; return `<ha-entity-picker data-epath="${path}" .value="${v}" value="${v}"${inc} allow-custom-entity></ha-entity-picker>`; }
        return `<input type="text" data-path="${path}" value="${String(v).replace(/"/g, "&quot;")}" placeholder="${ph || ""}">`;
    }
    _text(path, lbl, ph = "") { return `<div class="field"><label>${lbl}</label><input type="text" data-path="${path}" value="${String(this._get(path, "")).replace(/"/g, "&quot;")}" placeholder="${ph}"></div>`; }
    _range(path, lbl, min, max, step, suffix = "", def = min) { const v = Number(this._get(path, def)); return `<div class="field"><label>${lbl}</label><div class="range-wrap"><input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}"><span class="range-val" data-rv="${path}">${v}${suffix}</span></div></div>`; }
    _select(path, lbl, opts) { const cur = String(this._get(path, opts[0].value)); return `<div class="field"><label>${lbl}</label><select data-path="${path}">${opts.map((o) => `<option value="${o.value}"${cur === o.value ? " selected" : ""}>${o.label}</option>`).join("")}</select></div>`; }
    _toggle(path, lbl, def = false) { return `<div class="tog-row"><label>${lbl}</label><label class="switch"><input type="checkbox" data-path="${path}"${Boolean(this._get(path, def)) ? " checked" : ""}><span class="sw-track"></span></label></div>`; }
    _color(path, lbl, def = "#006666") { let raw = String(this._get(path, "") || def); if (!/^#[0-9a-fA-F]{6}$/i.test(raw)) raw = def; return `<div class="field"><label>${lbl}</label><div class="color-field" data-colorpath="${path}"><div class="color-swatch" style="background:${raw}"><input type="color" value="${raw}"></div><input type="text" class="color-hex" value="${raw.toUpperCase()}" placeholder="#RRGGBB" maxlength="7"></div></div>`; }
    _font(path, lbl) { const cur = String(this._get(path, "")); const isC = cur !== "" && !FONT_PRESETS.find((p) => p.v === cur && p.v !== "__custom__"); const sel = isC ? "__custom__" : cur; return `<div class="field"><label>${lbl}</label><select data-path="${path}" data-font-sel>${FONT_PRESETS.map((p) => `<option value="${p.v}"${sel === p.v ? " selected" : ""}>${p.l}</option>`).join("")}</select><input type="text" data-path="${path}" data-font-custom placeholder="e.g. Dancing Script" style="${isC ? "" : "display:none"}" value="${isC ? cur : ""}"><small class="font-hint">Google Fonts load automatically.</small></div>`; }
    _labelBlock(prefix, hasText = true) { return `${this._toggle(`${prefix}.show`, "Visible", true)}${hasText ? this._text(`${prefix}.text`, "Text override", "blank = auto") : ""}<div class="row2">${this._text(`${prefix}.size`, "Size (e.g. 15px)", "15px")}${this._select(`${prefix}.weight`, "Weight", [{ value: "", label: "Default" }, { value: "300", label: "300" }, { value: "400", label: "400" }, { value: "500", label: "500" }, { value: "600", label: "600" }, { value: "700", label: "700" }, { value: "900", label: "900" }])}</div>${this._font(`${prefix}.font`, "Font family")}${this._color(`${prefix}.color`, "Color", "#1E2938")}`; }
    _render() {
        const sr = this.shadowRoot;
        const html = `
      ${this._sec("entity", "🕐 Time Source", `
        <div class="field"><label>Time entity (blank = live wall clock)</label>${this._entityPicker("entity", ["input_datetime", "sensor"], "input_datetime.my_time")}</div>
        <div class="field"><label>Date entity for caption (optional)</label>${this._entityPicker("date_entity", ["input_datetime", "sensor"], "input_datetime.my_date")}</div>`)}
      ${this._sec("layout", "📐 Layout", `${this._select("face_style", "Face style", [{ value: "flat", label: "Flat (soft recessed)" }, { value: "bowl", label: "Bowl (deep shaded)" }])}${this._range("card_size", "Clock size (px)", 180, 460, 10, "px", 300)}${this._toggle("seconds", "Show seconds hand")}${this._toggle("smooth", "Smooth sweep (vs ticking)")}${this._toggle("show_ticks", "Show hour ticks")}${this._toggle("show_numerals", "Show 12/3/6/9 numerals")}${this._toggle("no_border", "No border / transparent")}`)}
      ${this._sec("colors", "🎨 Colours", `${this._color("hand_color", "Hands (hour + minute)", "#2f47d6")}${this._color("seconds_color", "Seconds hand", "#006666")}`)}
      ${this._sec("date", "📅 Date Caption", `${this._toggle("show_date", "Show date caption", true)}${this._select("date_format", "Format", [{ value: "long", label: "Sunday, July 25" }, { value: "short", label: "Sun, Jul 25" }, { value: "weekday", label: "Sunday" }, { value: "numeric", label: "07/25/2025" }])}${this._labelBlock("date_label", true)}`)}
    `;
        const style = document.createElement("style"); style.textContent = CLOCK_EDITOR_CSS;
        const div = document.createElement("div"); div.innerHTML = html;
        // entity pickers
        div.querySelectorAll("ha-entity-picker[data-epath]").forEach((ep) => {
            ep.hass = this._hass;
            ep.addEventListener("value-changed", (e) => this._set(ep.dataset.epath, e.detail.value));
        });
        div.querySelectorAll('input[type=text][data-path]:not(.color-hex):not([data-font-custom])').forEach((el) => {
            el.addEventListener("change", () => { let v = el.value; if (el.dataset.path.endsWith(".size") && v !== "" && /^\d+(\.\d+)?$/.test(v)) v = v + "px"; this._set(el.dataset.path, v === "" ? undefined : v); this._render(); });
        });
        div.querySelectorAll("select[data-path]").forEach((sel) => {
            sel.addEventListener("change", () => {
                if (sel.dataset.fontSel !== undefined) { const ci = sel.nextElementSibling; if (sel.value === "__custom__") { ci.style.display = ""; ci.focus(); return; } if (ci) ci.style.display = "none"; if (sel.value) this._loadFont(sel.value); }
                this._set(sel.dataset.path, sel.value === "" ? undefined : sel.value); this._render();
            });
        });
        div.querySelectorAll("input[data-font-custom]").forEach((el) => el.addEventListener("change", () => { if (el.value.trim()) this._loadFont(el.value.trim()); this._set(el.dataset.path, el.value.trim() || undefined); this._render(); }));
        div.querySelectorAll("input[type=checkbox][data-path]").forEach((el) => el.addEventListener("change", () => { this._set(el.dataset.path, el.checked); this._render(); }));
        div.querySelectorAll("input[type=range][data-path]").forEach((el) => {
            el.addEventListener("input", () => { const rv = div.querySelector(`[data-rv="${el.dataset.path}"]`); if (rv) rv.textContent = el.value + (el.dataset.suffix || ""); });
            el.addEventListener("change", () => { this._set(el.dataset.path, Number(el.value)); this._render(); });
        });
        div.querySelectorAll(".color-field[data-colorpath]").forEach((field) => {
            const path = field.dataset.colorpath; const native = field.querySelector("input[type=color]"); const swatch = field.querySelector(".color-swatch"); const text = field.querySelector("input.color-hex");
            native.addEventListener("input", () => { swatch.style.background = native.value; text.value = native.value.toUpperCase(); });
            native.addEventListener("change", () => { this._set(path, native.value); this._render(); });
            text.addEventListener("change", () => { let v = text.value.trim(); if (!v.startsWith("#")) v = "#" + v; if (/^#[0-9a-fA-F]{6}$/i.test(v)) { this._set(path, v); this._render(); } });
        });
        div.querySelectorAll(".sec-hdr[data-sec]").forEach((el) => el.addEventListener("click", () => this._toggleSection(el.dataset.sec)));
        sr.innerHTML = ""; sr.appendChild(style); sr.appendChild(div);
    }
}

customElements.define("neumorphic-clock-editor", NeumorphicClockCardEditor);
customElements.define("neumorphic-clock-card", NeumorphicClockCard);
window.customCards = (_a = window.customCards) !== null && _a !== void 0 ? _a : [];
window.customCards.push({
    type: "neumorphic-clock-card",
    name: "Neumorphic Clock",
    description: "Minimalist soft-UI analog clock for a time entity, with optional date caption — Neumorphic theme",
    preview: true,
});
