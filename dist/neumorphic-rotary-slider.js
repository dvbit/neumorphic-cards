"use strict";
/**
 * Neumorphic Rotary Slider Card  v2.0
 * ──────────────────────────────────
 * A circular knob-style card for Home Assistant.
 * Compatible with the Neumorphic theme (etnlbck/hacs-neumorphic-template).
 *
 * Every text label is independently optional and fully typographically
 * configurable via a LabelConfig sub-object.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  FULL CONFIG REFERENCE                                      │
 * │                                                             │
 * │  type: custom:neumorphic-rotary-slider                      │
 * │  entity: input_number.living_room_temp                      │
 * │  attribute: ~            # optional HA attribute override   │
 * │  min: 16                 # range minimum (default 0)        │
 * │  max: 28                 # range maximum (default 100)      │
 * │  step: 0.5               # snap step    (default 1)         │
 * │  unit: "°C"              # appended to value display        │
 * │  service: input_number.set_value                            │
 * │  service_data_key: value                                    │
 * │  scale: 1                # multiply before calling service  │
 * │                                                             │
 * │  # Each label block is OPTIONAL.                            │
 * │  # Omit the block entirely to hide the label.               │
 * │  # All sub-keys within a block are also optional.           │
 * │                                                             │
 * │  title_label:            # top heading                      │
 * │    text: Temperature     # override display text            │
 * │    show: true            # false hides it  (default true)   │
 * │    font: sans-serif      # CSS font-family                  │
 * │    size: 13px            # CSS font-size                    │
 * │    color: "#888888"      # CSS color                        │
 * │    weight: 400           # CSS font-weight                  │
 * │    transform: uppercase  # CSS text-transform               │
 * │    spacing: 0.08em       # CSS letter-spacing               │
 * │                                                             │
 * │  value_label:            # current value, centre-bottom     │
 * │    show: true                                               │
 * │    font: ~               # inherits primary font            │
 * │    size: 22px                                               │
 * │    color: ~              # inherits --primary-text-color    │
 * │    weight: 500                                              │
 * │                                                             │
 * │  min_label:              # bottom-left                      │
 * │    show: true                                               │
 * │    text: "Low"           # override; default = numeric min  │
 * │    size: 11px                                               │
 * │    color: ~                                                 │
 * │                                                             │
 * │  max_label:              # bottom-right                     │
 * │    show: true                                               │
 * │    text: "High"          # override; default = numeric max  │
 * │    size: 11px                                               │
 * │    color: ~                                                 │
 * └─────────────────────────────────────────────────────────────┘
 */
var _a;
var _b;
// ── Palettes ──────────────────────────────────────────────────────────────────
const DARK_PALETTE = {
    bg: "#23272e",
    shadowDark: "#181a1f",
    shadowLight: "#2c3140",
    track: "#1a1d23",
    accent1: "#2196f3",
    accent2: "#32d48e",
    handleBg: "#2a2f3a",
    handleDot: "#32d48e",
    innerBorder: "rgba(44,49,64,0.7)",
    textMuted: "#888888",
    textPrimary: "#e0e0e0",
    glow: "#2196f3", // blue glow behind handle in dark mode
};
const LIGHT_PALETTE = {
    bg: "#e0e0e0",
    shadowDark: "#bebebe",
    shadowLight: "#ffffff",
    track: "#c8c8c8",
    accent1: "#a3b1c6",
    accent2: "#7b8fa8",
    handleBg: "#d6d6d6",
    handleDot: "#a3b1c6",
    innerBorder: "rgba(180,180,180,0.5)",
    textMuted: "#888888",
    textPrimary: "#333333",
    glow: "#a3b1c6", // soft blue-grey glow in light mode
};
// ── Dark-mode detection ───────────────────────────────────────────────────────
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
/** Convert a hex colour + alpha [0..1] to a CSS rgba() string. */
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
/**
 * Linearly interpolate between two hex colours.
 * t = 0 returns colorA, t = 1 returns colorB.
 * Used to colour each dial tick according to its position along the arc.
 */
function hexLerp(colorA, colorB, t) {
    function parse(hex) {
        const c = hex.replace("#", "").trim();
        if (c.length === 3)
            return [
                parseInt(c[0] + c[0], 16),
                parseInt(c[1] + c[1], 16),
                parseInt(c[2] + c[2], 16),
            ];
        return [
            parseInt(c.slice(0, 2), 16),
            parseInt(c.slice(2, 4), 16),
            parseInt(c.slice(4, 6), 16),
        ];
    }
    const [r1, g1, b1] = parse(colorA);
    const [r2, g2, b2] = parse(colorB);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
}
// ── Label helpers ─────────────────────────────────────────────────────────────
/** Returns false only when the user explicitly wrote `show: false`. */
function labelVisible(cfg) {
    if (cfg === undefined)
        return true; // block present but no show key → visible
    return cfg.show !== false;
}
/**
 * Apply a LabelConfig's typography overrides to a DOM element.
 * Only properties explicitly set in the config are written; everything
 * else falls back to the CSS class defaults already on the element.
 */
function applyTypography(el, cfg) {
    if (!cfg)
        return;
    // Use != null (not truthiness) so "0px", weight:0, empty-reset all work correctly
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
// ── Card ──────────────────────────────────────────────────────────────────────
class NeumorphicRotarySliderCard extends HTMLElement {
    constructor() {
        super(...arguments);
        this._hass = null;
        this._config = null;
        this._canvas = null;
        this._isDark = true;
        this._value = 0;
        this._dragging = false;
        this._rafPending = false;
        // _commitTimer removed — service call fires synchronously on pointer release
        /**
         * The scaled value we most recently sent to HA (i.e. what callService used).
         * null means no pending command.
         *
         * _syncFromEntity compares every incoming HA state against this value:
         *   - If it matches → Alexa confirmed our command → accept it, clear pending.
         *   - If it differs → stale update (old value still echoing back) → ignore it.
         *
         * This is robust regardless of cloud round-trip time: we never rely on a
         * fixed timeout, we simply wait until HA reports exactly what we asked for.
         */
        this._pendingScaled = null;
        this._themeObserver = null;
        // ── Pointer events ────────────────────────────────────────────────────────
        this._onPointerDown = (e) => {
            var _a;
            if ((_a = this._config) === null || _a === void 0 ? void 0 : _a.display_only)
                return;
            if (!this._isOnHandle(e))
                return;
            this._dragging = true;
            this._canvas.setPointerCapture(e.pointerId);
            e.preventDefault();
        };
        this._onPointerMove = (e) => {
            if (!this._dragging)
                return;
            this._value = this._valueFromPointer(e);
            this._scheduleDraw();
            e.preventDefault();
        };
        this._onPointerUp = (_e) => {
            if (!this._dragging)
                return;
            this._dragging = false;
            // 1. Snap _value to step and compute the exact scaled value we will send.
            //    Do this synchronously so _pendingScaled is set BEFORE any HA state
            //    update can arrive — no race condition regardless of how fast the user
            //    releases or how quickly Alexa echoes back the old state.
            if (!this._config)
                return;
            const { min = 0, max = 100, step = 1, scale = 1 } = this._config;
            let raw = min + this._value * (max - min);
            raw = Math.round(raw / step) * step;
            this._value = (raw - min) / (max - min);
            this._pendingScaled = parseFloat((raw * scale).toFixed(6));
            // 2. Redraw immediately at the snapped position.
            this._scheduleDraw();
            // 3. Fire the service call — no debounce needed since pointerup/cancel are
            //    on window and can only fire once per gesture.
            this._commitValue();
        };
    }
    // ── Geometry — all derived from card_size ──────────────────────────────────
    //
    // card_size  = CSS diameter display diameter of the canvas element (default 220px).
    // W (bitmap) = card_size + 40px bleed margin so the glow can extend outside
    //              the disc without hitting the bitmap edge.
    // All other dimensions scale linearly with card_size so the card looks
    // identical regardless of size — just bigger or smaller.
    //
    // ── Angle helpers ─────────────────────────────────────────────────────────
    //
    // User space  : 0° = bottom (6 o'clock), clockwise positive.
    // Canvas space: 0° = right  (3 o'clock), clockwise positive (y-axis down).
    //
    // Conversion: canvas_rad = user_deg * (π/180) + π/2
    //   because canvas 0° is 90° ahead of user 0° (bottom).
    //
    // Verified:  user 45°  → canvas π*0.75 = current START_ANG  ✓
    //            user 315° → canvas π*2.25 = current END_ANG    ✓
    _degToRad(userDeg) {
        return userDeg * Math.PI / 180 + Math.PI / 2;
    }
    /** Canvas start angle for the MIN position. */
    get START_ANG() {
        var _a, _b, _c, _d;
        const zero = (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.zero_angle) !== null && _b !== void 0 ? _b : 0;
        const min = (_d = (_c = this._config) === null || _c === void 0 ? void 0 : _c.min_angle) !== null && _d !== void 0 ? _d : 45;
        return this._degToRad(zero + min);
    }
    /** Canvas end angle for the MAX position. Always > START_ANG (clockwise). */
    get END_ANG() {
        var _a, _b, _c, _d, _f, _g;
        const zero = (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.zero_angle) !== null && _b !== void 0 ? _b : 0;
        const minDeg = (_d = (_c = this._config) === null || _c === void 0 ? void 0 : _c.min_angle) !== null && _d !== void 0 ? _d : 45;
        let maxDeg = (_g = (_f = this._config) === null || _f === void 0 ? void 0 : _f.max_angle) !== null && _g !== void 0 ? _g : 315;
        // Ensure the arc goes clockwise: if max ≤ min, wrap max by adding 360°
        if (maxDeg <= minDeg)
            maxDeg += 360;
        return this._degToRad(zero + maxDeg);
    }
    /** Card size: CSS display diameter in px. Clamped 100–400. */
    get KS() { var _a, _b; return Math.max(100, Math.min(400, (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.card_size) !== null && _b !== void 0 ? _b : 220)); }
    /** Canvas bitmap side length = display size + 40px bleed margin. */
    get W() { return this.KS + 40; }
    /** Canvas centre coordinates. */
    get CX() { return this.W / 2; }
    get CY() { return this.W / 2; }
    /** Disc radius scales with card_size; user override clamped within safe range. */
    get DISC_R() {
        var _a, _b;
        const def = Math.round(this.KS * 0.432); // 95/220 ≈ 0.432
        return Math.max(40, Math.min(this.KS * 0.52, (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.disc_radius) !== null && _b !== void 0 ? _b : def));
    }
    /** Handle radius scales with card_size; user override clamped. */
    get HANDLE_R() {
        var _a, _b;
        const def = Math.round(this.KS * 0.10); // 22/220 ≈ 0.10
        return Math.max(6, Math.min(this.KS * 0.18, (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.handle_radius) !== null && _b !== void 0 ? _b : def));
    }
    /** Glow intensity 0–1, default 0.65. */
    get GLOW_INT() { var _a, _b; return Math.max(0, Math.min(1, (_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.glow_intensity) !== null && _b !== void 0 ? _b : 0.65)); }
    /** Scale factor relative to the default 220px design. Used to scale fixed px values. */
    get SCALE() { return this.KS / 220; }
    // Keep OUTER_R / INNER_R as aliases so nothing else breaks
    get OUTER_R() { return this.DISC_R; }
    get INNER_R() { return this.DISC_R; }
    // ── Lifecycle ──────────────────────────────────────────────────────────────
    connectedCallback() {
        this._build();
        this._applyLabelConfig(); // config arrived before DOM — apply now
        this._attachEvents();
        this._watchTheme();
        this._isDark = resolveIsDark(this._hass);
        this._scheduleDraw();
    }
    disconnectedCallback() {
        var _a;
        this._detachEvents();
        (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        this._themeObserver = null;
    }
    // ── HA interface ───────────────────────────────────────────────────────────
    setConfig(config) {
        if (!config.entity)
            throw new Error("neumorphic-rotary-slider: 'entity' is required");
        this._config = Object.assign({ min: 0, max: 100, step: 1, unit: "", service_data_key: "value", scale: 1 }, config);
        // Re-apply style (sizes may have changed) and label config
        if (this.shadowRoot) {
            this._updateStyle();
            // Sync canvas element size in case card_size changed
            if (this._canvas) {
                this._canvas.width = this.W;
                this._canvas.height = this.W;
                this._canvas.style.width = this.KS + "px";
                this._canvas.style.height = this.KS + "px";
            }
            // Sync center overlay size
            const cw = this.shadowRoot.getElementById("value-center-wrap");
            if (cw) {
                cw.style.width = this.KS + "px";
                cw.style.height = this.KS + "px";
            }
            this._applyLabelConfig();
        }
    }
    set hass(hass) {
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        this._syncFromEntity();
        this._scheduleDraw();
    }
    // ── DOM build ─────────────────────────────────────────────────────────────
    //
    // Structure (inside shadow root):
    //
    //  ha-card
    //  ├── div.title#title-label       ← major label (top heading)
    //  ├── div.minor-label#minor-label  ← minor label (subtitle)
    //  └── div.knob-wrap
    //      ├── canvas
    //      ├── div.value-center#value-center-wrap  ← value overlay on disc
    //      │   └── span#value-center-display
    //      ├── div.range-row
    //      │   ├── span#min-display        ← min caption (static)
    //      │   ├── span#min-value-display  ← min numeric value
    //      │   ├── span#max-value-display  ← max numeric value
    //      │   └── span#max-display        ← max caption (static)
    //      ├── div.value-wrap
    //      │   └── span#value-display      ← current value (below)
    // ── Dynamic stylesheet ───────────────────────────────────────────────────
    // Called from _build (initial) and from setConfig (when card_size changes).
    // All px values derive from KS (card_size) via SCALE factor so the widget
    // looks identical at any size.
    _updateStyle(styleEl) {
        var _a, _b, _c, _d, _f, _g;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el)
            return;
        const ks = this.KS;
        const sc = this.SCALE;
        const p28 = Math.round(28 * sc);
        const p20 = Math.round(20 * sc);
        const pb = Math.round(56 * sc);
        const mb24 = Math.round(24 * sc);
        const fs13 = (13 * sc).toFixed(1);
        const fs11 = (11 * sc).toFixed(1);
        const fs22 = (22 * sc).toFixed(1);
        const fs32 = (32 * sc).toFixed(1);
        const mt4 = Math.round(4 * sc);
        const mt8 = Math.round(8 * sc);
        const rh = Math.round(18 * sc);
        el.textContent = `
      :host { display: block; }

      ha-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: ${p28}px ${p20}px ${p20}px;
        box-sizing: border-box;
        background:    ${((_b = this._config) === null || _b === void 0 ? void 0 : _b.no_border) ? 'transparent' : 'var(--ha-card-background, var(--card-background-color, #23272e))'};
        border-radius: ${((_c = this._config) === null || _c === void 0 ? void 0 : _c.no_border) ? '0' : 'var(--ha-card-border-radius, 18px)'};
        box-shadow:    ${((_d = this._config) === null || _d === void 0 ? void 0 : _d.no_border) ? 'none' : 'var(--ha-card-box-shadow, 8px 8px 18px #181a1f, -8px -8px 18px #2c3140)'};
      }

      .title {
        font-family:    var(--primary-font-family, sans-serif);
        font-size:      ${fs13}px;
        font-weight:    400;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color:          var(--text-medium-light-color, #888);
        margin-bottom:  ${mb24}px;
      }

      .knob-wrap {
        position:       relative;
        width:          ${ks}px;
        padding-bottom: ${pb}px;
      }

      canvas {
        display:             block;
        cursor:              ${((_f = this._config) === null || _f === void 0 ? void 0 : _f.display_only) ? 'default' : 'grab'};
        touch-action:        none;
        user-select:         none;
        -webkit-user-select: none;
      }
      canvas:active { cursor: ${((_g = this._config) === null || _g === void 0 ? void 0 : _g.display_only) ? 'default' : 'grabbing'}; }
      /* display_only: cursor:default already set above via template literal */

      .range-row {
        position:    relative;
        height:      ${rh * 2}px;
        margin-top:  ${mt8}px;
        font-family: var(--primary-font-family, sans-serif);
        font-size:   ${fs11}px;
        color:       var(--text-medium-light-color, #666);
      }
      #min-display       { position: absolute; left:  ${mt8}px; top: 0; }
      #max-display       { position: absolute; right: ${mt8}px; top: 0; }
      #min-value-display { position: absolute; left:  ${mt8}px; top: ${rh}px; font-family: var(--primary-font-family, sans-serif); color: var(--primary-text-color, #e0e0e0); }
      #max-value-display { position: absolute; right: ${mt8}px; top: ${rh}px; font-family: var(--primary-font-family, sans-serif); color: var(--primary-text-color, #e0e0e0); text-align: right; }

      .value-wrap {
        display:         flex;
        justify-content: center;
        margin-top:      ${mt4}px;
      }
      .value-wrap span {
        font-family: var(--primary-font-family, sans-serif);
        font-size:   ${fs22}px;
        font-weight: 500;
        color:       var(--primary-text-color, #e0e0e0);
        white-space: nowrap;
      }

      .value-center {
        position:        absolute;
        top: 0; left: 0;
        width:           ${ks}px;
        height:          ${ks}px;
        display:         flex;
        align-items:     center;
        justify-content: center;
        pointer-events:  none;
        flex-direction:  column;
        gap:             ${Math.round(4 * sc)}px;
      }
      .value-center span {
        font-family: var(--primary-font-family, sans-serif);
        font-size:   ${fs32}px;
        font-weight: 500;
        color:       var(--primary-text-color, #e0e0e0);
        white-space: nowrap;
        text-align:  center;
      }

      /* ── minor label ── */
      .minor-label {
        font-family:    var(--primary-font-family, sans-serif);
        font-size:      ${fs11}px;
        font-weight:    400;
        letter-spacing: 0.06em;
        color:          var(--text-medium-light-color, #888);
        margin-bottom:  ${Math.round(6 * sc)}px;
        text-align:     center;
      }


    `;
    }
    _build() {
        if (this.shadowRoot)
            return;
        const shadow = this.attachShadow({ mode: "open" });
        // ── base stylesheet ────────────────────────────────────────────────────
        const style = document.createElement("style");
        style.id = "neu-style";
        this._updateStyle(style);
        // ── elements ──────────────────────────────────────────────────────────
        const card = document.createElement("ha-card");
        const titleEl = document.createElement("div");
        const wrap = document.createElement("div");
        const canvas = document.createElement("canvas");
        const rangeRow = document.createElement("div");
        const minSpan = document.createElement("span");
        const maxSpan = document.createElement("span");
        const valueWrap = document.createElement("div");
        const valueSpan = document.createElement("span");
        titleEl.className = "title";
        titleEl.id = "title-label";
        wrap.className = "knob-wrap";
        canvas.width = this.W;
        canvas.height = this.W;
        canvas.style.width = this.KS + "px";
        canvas.style.height = this.KS + "px";
        rangeRow.className = "range-row";
        minSpan.id = "min-display";
        maxSpan.id = "max-display";
        valueWrap.className = "value-wrap";
        valueSpan.id = "value-display";
        this._canvas = canvas;
        // ── Minor label ──────────────────────────────────────────────────────────
        const minorEl = document.createElement("div");
        minorEl.className = "minor-label";
        minorEl.id = "minor-label";
        // ── Center-value overlay ─────────────────────────────────────────────────
        const centerWrap = document.createElement("div");
        const centerSpan = document.createElement("span");
        centerWrap.className = "value-center";
        centerWrap.id = "value-center-wrap";
        centerSpan.id = "value-center-display";
        centerWrap.appendChild(centerSpan);
        // ── Icon row — lives OUTSIDE knob-wrap at ha-card level ─────────────────
        const minValSpan = document.createElement("span");
        const maxValSpan = document.createElement("span");
        minValSpan.id = "min-value-display";
        maxValSpan.id = "max-value-display";
        // ── Below-row (for icon_position=below) ──────────────────────────────────
        const belowRow = document.createElement("div");
        belowRow.className = "below-row";
        belowRow.id = "below-row";
        rangeRow.appendChild(minSpan);
        rangeRow.appendChild(minValSpan);
        rangeRow.appendChild(maxValSpan);
        rangeRow.appendChild(maxSpan);
        valueWrap.appendChild(valueSpan);
        wrap.appendChild(canvas);
        wrap.appendChild(centerWrap);
        wrap.appendChild(rangeRow);
        wrap.appendChild(valueWrap);
        card.appendChild(titleEl);
        card.appendChild(minorEl);
        card.appendChild(wrap);
        shadow.appendChild(style);
        shadow.appendChild(card);
    }
    // ── Label config application ───────────────────────────────────────────────
    //
    // Called after _build() whenever config changes.
    // Sets visibility and applies any typography overrides.
    _applyLabelConfig() {
        var _a;
        if (!this._config || !this.shadowRoot)
            return;
        const sr = this.shadowRoot;
        const cfg = this._config;
        const pos = (_a = cfg.value_position) !== null && _a !== void 0 ? _a : "below";
        // ── Major title ────────────────────────────────────────────────────────
        const titleEl = sr.getElementById("title-label");
        if (titleEl) {
            const vis = labelVisible(cfg.title_label);
            titleEl.style.display = vis ? "" : "none";
            if (vis)
                applyTypography(titleEl, cfg.title_label);
        }
        // ── Minor label ───────────────────────────────────────────────────────
        const minorEl = sr.getElementById("minor-label");
        if (minorEl) {
            const vis = labelVisible(cfg.minor_label);
            minorEl.style.display = vis ? "" : "none";
            if (vis)
                applyTypography(minorEl, cfg.minor_label);
        }
        // ── Min / Max caption labels ──────────────────────────────────────────
        for (const { id, labelCfg } of [
            { id: "min-display", labelCfg: cfg.min_label },
            { id: "max-display", labelCfg: cfg.max_label },
        ]) {
            const el = sr.getElementById(id);
            if (!el)
                continue;
            const vis = labelVisible(labelCfg);
            el.style.display = vis ? "" : "none";
            if (vis)
                applyTypography(el, labelCfg);
        }
        // ── Min / Max value displays ──────────────────────────────────────────
        for (const { id, labelCfg } of [
            { id: "min-value-display", labelCfg: cfg.min_value_label },
            { id: "max-value-display", labelCfg: cfg.max_value_label },
        ]) {
            const el = sr.getElementById(id);
            if (!el)
                continue;
            const vis = labelVisible(labelCfg);
            el.style.display = vis ? "" : "none";
            if (vis)
                applyTypography(el, labelCfg);
        }
        // ── Range row: hide when ALL four are hidden ──────────────────────────
        const rangeRow = sr.querySelector(".range-row");
        if (rangeRow) {
            const any = labelVisible(cfg.min_label) || labelVisible(cfg.max_label)
                || labelVisible(cfg.min_value_label) || labelVisible(cfg.max_value_label);
            rangeRow.style.display = any ? "" : "none";
        }
        // (display_only only affects _draw — no DOM class needed)
        // ── Value display ────────────────────────────────────────────────────
        const showValue = labelVisible(cfg.value_label);
        const belowWrap = sr.querySelector(".value-wrap");
        const belowSpan = sr.getElementById("value-display");
        const centerWrap = sr.getElementById("value-center-wrap");
        const centerSpan = sr.getElementById("value-center-display");
        if (pos === "center") {
            if (belowWrap)
                belowWrap.style.display = "none";
            if (centerWrap)
                centerWrap.style.display = showValue ? "" : "none";
            if (centerSpan && showValue)
                applyTypography(centerSpan, cfg.value_label);
        }
        else {
            if (centerWrap)
                centerWrap.style.display = "none";
            if (belowWrap)
                belowWrap.style.display = showValue ? "" : "none";
            if (belowSpan && showValue)
                applyTypography(belowSpan, cfg.value_label);
        }
    }
    // ── Theme watcher ─────────────────────────────────────────────────────────
    _watchTheme() {
        var _a;
        this._themeObserver = new MutationObserver(() => {
            const wasDark = this._isDark;
            this._isDark = resolveIsDark(this._hass);
            if (this._isDark !== wasDark)
                this._scheduleDraw();
        });
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class", "style"],
        });
        (_a = window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, "(prefers-color-scheme: dark)").addEventListener("change", () => {
            this._isDark = resolveIsDark(this._hass);
            this._scheduleDraw();
        });
    }
    // ── Entity sync ───────────────────────────────────────────────────────────
    _syncFromEntity() {
        var _a, _b, _c, _d;
        // Never update during a drag.
        if (this._dragging)
            return;
        if (!this._hass || !this._config)
            return;
        const stateObj = this._hass.states[this._config.entity];
        if (!stateObj)
            return;
        let raw;
        if (this._config.attribute) {
            raw = parseFloat(String((_a = stateObj.attributes[this._config.attribute]) !== null && _a !== void 0 ? _a : 0));
        }
        else {
            raw = parseFloat(stateObj.state);
        }
        if (isNaN(raw))
            return;
        // If we have a pending command, compare the incoming HA value against it.
        //
        //  • HA value ≠ pending  →  this is a stale echo of the OLD state
        //                            (Alexa hasn't processed our command yet).
        //                            Ignore it — keep showing the optimistic value.
        //
        //  • HA value ≈ pending  →  Alexa confirmed our command.
        //                            Accept it and clear the pending flag so future
        //                            external changes (e.g. voice commands) come through.
        //
        // We use a small epsilon for floating-point comparison (HA may round).
        if (this._pendingScaled !== null) {
            const epsilon = 0.001;
            if (Math.abs(raw - this._pendingScaled) > epsilon) {
                return; // stale — ignore
            }
            this._pendingScaled = null; // confirmed — clear pending
        }
        const scale = (_b = this._config.scale) !== null && _b !== void 0 ? _b : 1;
        const min = (_c = this._config.min) !== null && _c !== void 0 ? _c : 0;
        const max = (_d = this._config.max) !== null && _d !== void 0 ? _d : 100;
        const actual = raw / scale;
        this._value = Math.max(0, Math.min(1, (actual - min) / (max - min)));
    }
    // ── Drawing ───────────────────────────────────────────────────────────────
    _scheduleDraw() {
        if (this._rafPending)
            return;
        this._rafPending = true;
        requestAnimationFrame(() => {
            this._rafPending = false;
            this._draw();
        });
    }
    _draw() {
        var _a, _b;
        if (!this._canvas || !this._config)
            return;
        const ctx = this._canvas.getContext("2d");
        if (!ctx)
            return;
        const p = this._isDark ? DARK_PALETTE : LIGHT_PALETTE;
        const glowColor = (_a = this._config.glow_color) !== null && _a !== void 0 ? _a : p.glow; // user override or palette default
        const { W, CX, CY, DISC_R, HANDLE_R } = this;
        // ── 1. Full clear ──────────────────────────────────────────────────────────
        ctx.clearRect(0, 0, W, W);
        const displayOnly = (_b = this._config.display_only) !== null && _b !== void 0 ? _b : false;
        // ── 2 & 3. Handle position + Glow (skipped in display_only) ──────────────
        if (!displayOnly) {
            const hp = this._handlePos();
            const clipR = W / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(CX, CY, clipR, 0, Math.PI * 2);
            ctx.clip();
            const gi = this.GLOW_INT;
            const grad = ctx.createRadialGradient(hp.x, hp.y, HANDLE_R * 0.2, hp.x, hp.y, clipR);
            grad.addColorStop(0, hexAlpha(glowColor, gi * 1.00));
            grad.addColorStop(0.08, hexAlpha(glowColor, gi * 0.69));
            grad.addColorStop(0.20, hexAlpha(glowColor, gi * 0.34));
            grad.addColorStop(0.38, hexAlpha(glowColor, gi * 0.15));
            grad.addColorStop(0.55, hexAlpha(glowColor, gi * 0.06));
            grad.addColorStop(0.72, hexAlpha(glowColor, gi * 0.015));
            grad.addColorStop(1.0, hexAlpha(glowColor, 0));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, W);
            ctx.restore();
        }
        // ── 4. Under-disc range indicator ─────────────────────────────────────────
        this._drawRangeUnder(ctx, p);
        // ── 5. Under-disc endpoint markers ────────────────────────────────────────
        this._drawMarkersUnder(ctx, p);
        // ── 6. Single disc ────────────────────────────────────────────────────────
        const dOff = Math.round(9 * this.SCALE);
        const dBlr = Math.round(20 * this.SCALE);
        this._drawDisc(ctx, CX, CY, DISC_R, p.bg, p.shadowDark, p.shadowLight, dOff, dBlr);
        // ── 7. Optional 3D convex shading overlay ─────────────────────────────────
        if (this._config.disc_3d)
            this._drawDisc3D(ctx);
        // ── 8. Over-disc endpoint markers ─────────────────────────────────────────
        this._drawMarkersOver(ctx, p);
        // ── 9. Over-disc range indicator ──────────────────────────────────────────
        this._drawRangeOver(ctx, p);
        // ── 10. Handle button (skipped in display_only) ───────────────────────────
        if (!displayOnly) {
            const hp = this._handlePos();
            const hOff = Math.round(5 * this.SCALE);
            const hBlr = Math.round(12 * this.SCALE);
            this._drawDisc(ctx, hp.x, hp.y, HANDLE_R, p.handleBg, p.shadowDark, p.shadowLight, hOff, hBlr);
            ctx.beginPath();
            ctx.arc(hp.x, hp.y, Math.max(2, Math.round(HANDLE_R * 0.22)), 0, Math.PI * 2);
            ctx.fillStyle = p.handleDot;
            ctx.fill();
        }
        this._updateText();
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Range-style methods
    // ═══════════════════════════════════════════════════════════════════════════
    /** External range indicators drawn BEFORE the disc (appear behind it) */
    _drawRangeUnder(ctx, p) {
        var _a;
        if (!this._config)
            return;
        const rs = (_a = this._config.range_style) !== null && _a !== void 0 ? _a : "none";
        if (rs === "progress")
            this._drawProgressTrack(ctx, p);
        // dial_ticks drawn over (they sit outside disc, no layering needed)
    }
    /** External range indicators drawn AFTER the disc */
    _drawRangeOver(ctx, p) {
        var _a;
        if (!this._config)
            return;
        const rs = (_a = this._config.range_style) !== null && _a !== void 0 ? _a : "none";
        if (rs === "progress")
            this._drawProgressArc(ctx, p);
        if (rs === "dial_ticks")
            this._drawDialTicks(ctx, p);
    }
    /**
     * Progress style — grey full-range track outside the disc.
     * Drawn under the disc so the disc covers the inner half, only the ring shows.
     */
    _drawProgressTrack(ctx, p) {
        const { CX, CY, DISC_R, SCALE, START_ANG, END_ANG } = this;
        const trackR = DISC_R + Math.round(8 * SCALE);
        const lw = Math.max(2, Math.round(5 * SCALE));
        // Outer neumorphic channel (inset ring)
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, trackR, START_ANG, END_ANG, false);
        ctx.strokeStyle = this._isDark ? "#181a1f" : "#c8c8c8";
        ctx.lineWidth = lw + Math.round(2 * SCALE);
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(CX, CY, trackR, START_ANG, END_ANG, false);
        ctx.strokeStyle = this._isDark ? "#2c3140" : "#f0f0f0";
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }
    /** Progress arc — coloured fill up to current value, drawn over the track */
    _drawProgressArc(ctx, p) {
        var _a, _b;
        if (!this._config || this._value <= 0.005)
            return;
        const { CX, CY, DISC_R, SCALE, START_ANG, END_ANG } = this;
        const trackR = DISC_R + Math.round(8 * SCALE);
        const lw = Math.max(2, Math.round(5 * SCALE));
        const curAng = START_ANG + this._value * (END_ANG - START_ANG);
        const colorStart = (_b = (_a = this._config.progress_color) !== null && _a !== void 0 ? _a : this._config.glow_color) !== null && _b !== void 0 ? _b : p.glow;
        const colorEnd = this._config.progress_color_end;
        // ── Resolve stroke style: gradient or solid ────────────────────────────
        // We use createConicGradient (supported in all modern browsers) when a
        // gradient is requested. It maps colour stops around a centre point by
        // angle, which is exactly what an arc needs — the colour follows the arc
        // rather than spanning a straight chord.
        //
        // Fallback (no gradient / browser missing createConicGradient): solid.
        let strokeStyle = colorStart;
        if (colorEnd) {
            if (typeof ctx.createConicGradient === "function") {
                // createConicGradient(startAngle, cx, cy) — angles in radians.
                // We start the gradient at START_ANG so stop 0 = arc start colour.
                const conic = ctx.createConicGradient(START_ANG, CX, CY);
                // Map the value fraction within the full 0→1 stop space.
                // The arc spans (END_ANG - START_ANG) radians out of 2π total.
                // Stop positions are proportional fractions of the full circle (0–1).
                const totalAngle = Math.PI * 2;
                const arcSpan = END_ANG - START_ANG;
                const gradEnd = (arcSpan / totalAngle) * this._value; // end at current value
                const gradFull = arcSpan / totalAngle; // full arc span
                conic.addColorStop(0, colorStart);
                conic.addColorStop(gradEnd, colorEnd);
                // Beyond the arc end, clamp to colorEnd (prevents colour bleeding)
                conic.addColorStop(Math.min(gradFull + 0.01, 1), colorEnd);
                conic.addColorStop(1, colorEnd);
                strokeStyle = conic;
            }
            else {
                // Fallback: linear gradient from arc start-point to end-point.
                // Not as accurate for large arcs but acceptable.
                const sx = CX + trackR * Math.cos(START_ANG);
                const sy = CY + trackR * Math.sin(START_ANG);
                const ex = CX + trackR * Math.cos(curAng);
                const ey = CY + trackR * Math.sin(curAng);
                const lin = ctx.createLinearGradient(sx, sy, ex, ey);
                lin.addColorStop(0, colorStart);
                lin.addColorStop(1, colorEnd);
                strokeStyle = lin;
            }
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, trackR, START_ANG, curAng, false);
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lw;
        ctx.lineCap = "round";
        // Glow uses the start colour (most visible at the handle end)
        ctx.shadowColor = colorEnd !== null && colorEnd !== void 0 ? colorEnd : colorStart;
        ctx.shadowBlur = Math.round(6 * SCALE);
        ctx.stroke();
        ctx.restore();
    }
    /**
     * Dial ticks — evenly spaced radial marks around the outside of the disc,
     * like a physical analogue control. Matches the right knob in the reference image.
     * Ticks within the current value range are brighter.
     */
    _drawDialTicks(ctx, p) {
        var _a, _b, _c;
        if (!this._config)
            return;
        const { CX, CY, DISC_R, SCALE, START_ANG, END_ANG } = this;
        const count = Math.max(5, Math.min(41, (_a = this._config.dial_ticks) !== null && _a !== void 0 ? _a : 21));
        const gapR = Math.round(4 * SCALE);
        const tickLen = Math.round(10 * SCALE);
        const innerR = DISC_R + gapR;
        const outerR = DISC_R + gapR + tickLen;
        const lw = Math.max(1, Math.round(1.5 * SCALE));
        const RANGE = END_ANG - START_ANG;
        const curAng = START_ANG + this._value * RANGE;
        // Resolve gradient colours — same keys as the progress arc so the two
        // styles share a consistent colour language when used together.
        const colorStart = (_c = (_b = this._config.progress_color) !== null && _b !== void 0 ? _b : this._config.glow_color) !== null && _c !== void 0 ? _c : p.glow;
        const colorEnd = this._config.progress_color_end; // undefined = solid
        for (let i = 0; i < count; i++) {
            const t = i / (count - 1); // 0 at min, 1 at max
            const ang = START_ANG + t * RANGE;
            const ix = CX + innerR * Math.cos(ang);
            const iy = CY + innerR * Math.sin(ang);
            const ox = CX + outerR * Math.cos(ang);
            const oy = CY + outerR * Math.sin(ang);
            const active = ang <= curAng + 0.001; // small epsilon for floating-point safety
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(ix, iy);
            ctx.lineTo(ox, oy);
            if (active) {
                if (colorEnd) {
                    // Interpolate colour along the arc by tick position t
                    ctx.strokeStyle = hexLerp(colorStart, colorEnd, t);
                }
                else {
                    // Solid accent colour — use progress_color / glow_color if set,
                    // otherwise fall back to the classic bright-white/dark-black style.
                    const hasExplicitColor = !!(this._config.progress_color
                        || this._config.glow_color);
                    ctx.strokeStyle = hasExplicitColor
                        ? colorStart
                        : (this._isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.40)");
                }
            }
            else {
                // Inactive ticks are always muted, regardless of gradient setting
                ctx.strokeStyle = this._isDark
                    ? "rgba(255,255,255,0.15)"
                    : "rgba(0,0,0,0.14)";
            }
            ctx.lineWidth = lw;
            ctx.lineCap = "round";
            if (this._isDark) {
                ctx.shadowColor = "#111";
                ctx.shadowBlur = Math.round(2 * SCALE);
                ctx.shadowOffsetX = Math.round(1 * SCALE);
                ctx.shadowOffsetY = Math.round(1 * SCALE);
            }
            ctx.stroke();
            ctx.restore();
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // Endpoint marker methods (on the disc face)
    // ═══════════════════════════════════════════════════════════════════════════
    _drawMarkersUnder(ctx, p) {
        var _a;
        if (!this._config)
            return;
        const mode = (_a = this._config.markers) !== null && _a !== void 0 ? _a : "none";
        if (mode === "none")
            return;
        if (mode === "trail" || mode === "combined")
            this._drawTrail(ctx, p);
        if (mode === "ghosts" || mode === "combined")
            this._drawGhosts(ctx, p);
    }
    _drawMarkersOver(ctx, p) {
        var _a;
        if (!this._config)
            return;
        const mode = (_a = this._config.markers) !== null && _a !== void 0 ? _a : "none";
        if (mode === "none")
            return;
        if (mode === "ticks" || mode === "combined")
            this._drawTicks(ctx, p);
        if (mode === "dots" || mode === "combined")
            this._drawDots(ctx, p);
    }
    _drawTrail(ctx, p) {
        const { CX, CY, DISC_R, HANDLE_R, SCALE, START_ANG, END_ANG } = this;
        const orbit = DISC_R - HANDLE_R - 6 * SCALE;
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, orbit, START_ANG, END_ANG, false);
        ctx.strokeStyle = this._isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)";
        ctx.lineWidth = Math.max(1.5, 3 * SCALE);
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();
    }
    _drawTicks(ctx, p) {
        const { CX, CY, DISC_R, SCALE, START_ANG, END_ANG } = this;
        const tickLen = Math.round(11 * SCALE);
        for (const ang of [START_ANG, END_ANG]) {
            const ox = CX + DISC_R * Math.cos(ang);
            const oy = CY + DISC_R * Math.sin(ang);
            const ix = CX + (DISC_R - tickLen) * Math.cos(ang);
            const iy = CY + (DISC_R - tickLen) * Math.sin(ang);
            ctx.save();
            ctx.shadowColor = p.shadowDark;
            ctx.shadowBlur = Math.round(3 * SCALE);
            ctx.shadowOffsetX = Math.round(1 * SCALE);
            ctx.shadowOffsetY = Math.round(1 * SCALE);
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ix, iy);
            ctx.strokeStyle = this._isDark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.18)";
            ctx.lineWidth = Math.max(1.5, 2.5 * SCALE);
            ctx.lineCap = "round";
            ctx.stroke();
            ctx.restore();
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ix, iy);
            ctx.strokeStyle = this._isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)";
            ctx.lineWidth = Math.max(1, 1 * SCALE);
            ctx.lineCap = "round";
            ctx.stroke();
        }
    }
    _drawDots(ctx, p) {
        const { CX, CY, DISC_R, HANDLE_R, SCALE, START_ANG, END_ANG } = this;
        const orbit = DISC_R - HANDLE_R - 6 * SCALE;
        const dotR = Math.max(2.5, 4 * SCALE);
        const colors = [hexAlpha(p.accent1, 0.55), hexAlpha(p.accent2, 0.80)];
        for (const [i, ang] of [[0, START_ANG], [1, END_ANG]]) {
            const px = CX + orbit * Math.cos(ang);
            const py = CY + orbit * Math.sin(ang);
            ctx.save();
            ctx.shadowColor = colors[i];
            ctx.shadowBlur = Math.round(8 * SCALE);
            ctx.beginPath();
            ctx.arc(px, py, dotR, 0, Math.PI * 2);
            ctx.fillStyle = colors[i];
            ctx.fill();
            ctx.restore();
        }
    }
    _drawGhosts(ctx, p) {
        const { CX, CY, DISC_R, HANDLE_R, SCALE, START_ANG, END_ANG } = this;
        const orbit = DISC_R - HANDLE_R - 6 * SCALE;
        const glowRad = DISC_R * 0.45;
        for (const [i, ang] of [[0, START_ANG], [1, END_ANG]]) {
            const px = CX + orbit * Math.cos(ang);
            const py = CY + orbit * Math.sin(ang);
            const col = i === 0 ? p.accent1 : p.accent2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(CX, CY, DISC_R, 0, Math.PI * 2);
            ctx.clip();
            const gr = ctx.createRadialGradient(px, py, 0, px, py, glowRad);
            gr.addColorStop(0, hexAlpha(col, 0.18));
            gr.addColorStop(0.4, hexAlpha(col, 0.07));
            gr.addColorStop(1, hexAlpha(col, 0));
            ctx.fillStyle = gr;
            ctx.fillRect(CX - DISC_R, CY - DISC_R, DISC_R * 2, DISC_R * 2);
            ctx.restore();
        }
    }
    // ═══════════════════════════════════════════════════════════════════════════
    // 3D disc shading
    // ═══════════════════════════════════════════════════════════════════════════
    /**
     * Convex 3D shading overlay. A radial gradient from near-white at top-left
     * to near-transparent at bottom-right, simulating a convex surface lit from
     * top-left. Applied after the disc fill so it sits on top of the base colour.
     */
    _drawDisc3D(ctx) {
        const { CX, CY, DISC_R } = this;
        // Light source offset: top-left, ~35% of radius
        const lx = CX - DISC_R * 0.35;
        const ly = CY - DISC_R * 0.35;
        const grad = ctx.createRadialGradient(lx, ly, 0, CX, CY, DISC_R * 1.1);
        if (this._isDark) {
            grad.addColorStop(0, "rgba(255,255,255,0.13)");
            grad.addColorStop(0.35, "rgba(255,255,255,0.05)");
            grad.addColorStop(0.65, "rgba(0,0,0,0.04)");
            grad.addColorStop(1, "rgba(0,0,0,0.18)");
        }
        else {
            grad.addColorStop(0, "rgba(255,255,255,0.65)");
            grad.addColorStop(0.35, "rgba(255,255,255,0.20)");
            grad.addColorStop(0.65, "rgba(0,0,0,0.02)");
            grad.addColorStop(1, "rgba(0,0,0,0.10)");
        }
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, DISC_R, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    }
    _drawDisc(ctx, x, y, r, fill, shadowDark, shadowLight, offset, blur) {
        const passes = [
            [shadowDark, offset, offset],
            [shadowLight, -offset, -offset],
        ];
        for (const [color, ox, oy] of passes) {
            ctx.save();
            ctx.shadowColor = color;
            ctx.shadowBlur = blur;
            ctx.shadowOffsetX = ox;
            ctx.shadowOffsetY = oy;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.restore();
        }
    }
    // ── Text update ───────────────────────────────────────────────────────────
    _updateText() {
        var _a, _b, _c, _d, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        if (!this._config || !this.shadowRoot)
            return;
        const min = (_a = this._config.min) !== null && _a !== void 0 ? _a : 0;
        const max = (_b = this._config.max) !== null && _b !== void 0 ? _b : 100;
        const step = (_c = this._config.step) !== null && _c !== void 0 ? _c : 1;
        const unit = (_d = this._config.unit) !== null && _d !== void 0 ? _d : "";
        const raw = min + this._value * (max - min);
        const decimals = step < 1 ? ((_g = (_f = String(step).split(".")[1]) === null || _f === void 0 ? void 0 : _f.length) !== null && _g !== void 0 ? _g : 1) : 0;
        const sr = this.shadowRoot;
        // ── Major title ─────────────────────────────────────────────────────────
        const titleEl = sr.getElementById("title-label");
        if (titleEl && labelVisible(this._config.title_label)) {
            titleEl.textContent =
                (_k = (_j = (_h = this._config.title_label) === null || _h === void 0 ? void 0 : _h.text) !== null && _j !== void 0 ? _j : this._config.label) !== null && _k !== void 0 ? _k : this._config.entity;
        }
        // ── Minor label ─────────────────────────────────────────────────────────
        const minorEl = sr.getElementById("minor-label");
        if (minorEl && labelVisible(this._config.minor_label)) {
            minorEl.textContent = (_m = (_l = this._config.minor_label) === null || _l === void 0 ? void 0 : _l.text) !== null && _m !== void 0 ? _m : "";
        }
        // ── Current value ────────────────────────────────────────────────────────
        const pos = (_o = this._config.value_position) !== null && _o !== void 0 ? _o : "below";
        const activeId = pos === "center" ? "value-center-display" : "value-display";
        const valEl = sr.getElementById(activeId);
        if (valEl && labelVisible(this._config.value_label)) {
            valEl.textContent = raw.toFixed(decimals) + unit;
        }
        // ── Min caption (static text) ────────────────────────────────────────────
        const minEl = sr.getElementById("min-display");
        if (minEl && labelVisible(this._config.min_label)) {
            minEl.textContent = (_q = (_p = this._config.min_label) === null || _p === void 0 ? void 0 : _p.text) !== null && _q !== void 0 ? _q : "";
        }
        // ── Min numeric value ────────────────────────────────────────────────────
        const minValEl = sr.getElementById("min-value-display");
        if (minValEl && labelVisible(this._config.min_value_label)) {
            minValEl.textContent = (_s = (_r = this._config.min_value_label) === null || _r === void 0 ? void 0 : _r.text) !== null && _s !== void 0 ? _s : (min.toFixed(decimals) + unit);
        }
        // ── Max caption (static text) ────────────────────────────────────────────
        const maxEl = sr.getElementById("max-display");
        if (maxEl && labelVisible(this._config.max_label)) {
            maxEl.textContent = (_u = (_t = this._config.max_label) === null || _t === void 0 ? void 0 : _t.text) !== null && _u !== void 0 ? _u : "";
        }
        // ── Max numeric value ────────────────────────────────────────────────────
        const maxValEl = sr.getElementById("max-value-display");
        if (maxValEl && labelVisible(this._config.max_value_label)) {
            maxValEl.textContent = (_w = (_v = this._config.max_value_label) === null || _v === void 0 ? void 0 : _v.text) !== null && _w !== void 0 ? _w : (max.toFixed(decimals) + unit);
        }
    }
    _attachEvents() {
        if (!this._canvas)
            return;
        // pointerdown on canvas only — starts the drag
        this._canvas.addEventListener("pointerdown", this._onPointerDown);
        // pointermove + pointerup on WINDOW — ensures we receive these even when
        // the pointer leaves the canvas during a drag (very common on touch/mobile)
        window.addEventListener("pointermove", this._onPointerMove);
        window.addEventListener("pointerup", this._onPointerUp);
        window.addEventListener("pointercancel", this._onPointerUp);
    }
    _detachEvents() {
        if (!this._canvas)
            return;
        this._canvas.removeEventListener("pointerdown", this._onPointerDown);
        window.removeEventListener("pointermove", this._onPointerMove);
        window.removeEventListener("pointerup", this._onPointerUp);
        window.removeEventListener("pointercancel", this._onPointerUp);
    }
    // ── Geometry ──────────────────────────────────────────────────────────────
    _handlePos() {
        const a = this.START_ANG + this._value * (this.END_ANG - this.START_ANG);
        // Orbit radius: inset from disc edge so handle button stays fully inside.
        // DISC_R - HANDLE_R - 6 leaves a 6px gap between button edge and disc rim.
        const orbit = this.DISC_R - this.HANDLE_R - 6;
        return {
            x: this.CX + orbit * Math.cos(a),
            y: this.CY + orbit * Math.sin(a),
        };
    }
    _isOnHandle(e) {
        if (!this._canvas)
            return false;
        const rect = this._canvas.getBoundingClientRect();
        // rect.width is the CSS display width (220px); canvas bitmap is W (260px)
        const scale = this.W / rect.width;
        const dx = (e.clientX - rect.left) * scale - this._handlePos().x;
        const dy = (e.clientY - rect.top) * scale - this._handlePos().y;
        return Math.sqrt(dx * dx + dy * dy) < this.HANDLE_R + 14;
    }
    _valueFromPointer(e) {
        if (!this._canvas)
            return this._value;
        const rect = this._canvas.getBoundingClientRect();
        // scale: bitmap coords (260px) relative to CSS display size (220px)
        const scale = this.W / rect.width;
        const cx = (e.clientX - rect.left) * scale - this.CX;
        const cy = (e.clientY - rect.top) * scale - this.CY;
        const { START_ANG, END_ANG } = this;
        const RANGE = END_ANG - START_ANG;
        let a = Math.atan2(cy, cx);
        if (a < START_ANG - Math.PI * 2)
            a += Math.PI * 2;
        if (a < START_ANG)
            a += Math.PI * 2;
        return Math.max(0, Math.min(1, (a - START_ANG) / RANGE));
    }
    // ── Service call ──────────────────────────────────────────────────────────
    _commitValue() {
        var _a, _b, _c;
        if ((_a = this._config) === null || _a === void 0 ? void 0 : _a.display_only)
            return;
        if (!this._hass || !((_b = this._config) === null || _b === void 0 ? void 0 : _b.service) || this._pendingScaled === null)
            return;
        // _pendingScaled was already set in _onPointerUp — just send it.
        // No debounce: pointerup and pointercancel are both on window, so only one
        // will fire per gesture. Calling the service immediately means Alexa gets
        // the command the instant the user releases with zero artificial delay.
        const scaled = this._pendingScaled;
        const [domain, svc] = this._config.service.split(".");
        this._hass.callService(domain, svc, {
            entity_id: this._config.entity,
            [(_c = this._config.service_data_key) !== null && _c !== void 0 ? _c : "value"]: scaled,
        });
    }
    // ── Card meta ─────────────────────────────────────────────────────────────
    static getStubConfig() {
        return {
            entity: "media_player.living_room",
            attribute: "volume_level",
            min: 0,
            max: 100,
            step: 1,
            unit: "%",
            service: "media_player.volume_set",
            service_data_key: "volume_level",
            scale: 0.01,
            label: "Volume",
            value_position: "below", // "below" | "center"
            glow_color: undefined, // e.g. "#ff6b35" — omit to use theme default
            markers: "none", // "none" | "ticks" | "trail" | "dots" | "ghosts" | "combined"
            range_style: "none", // "none" | "progress" | "dial_ticks"
            dial_ticks: 21, // number of ticks for dial_ticks style
            progress_color: undefined, // CSS colour for progress arc (solid or gradient start)
            progress_color_end: undefined, // CSS colour for gradient end — omit for solid
            disc_3d: false, // true = convex 3D shading on disc
            // Angular range — these defaults reproduce the current 270° bottom-centred arc
            zero_angle: 0, // 0=bottom, 90=left, 180=top, 270=right
            min_angle: 45, // degrees CW from zero_angle for MIN position
            max_angle: 315, // degrees CW from zero_angle for MAX position
            glow_intensity: 0.65, // 0.0 – 1.0
            card_size: 220, // CSS px, 100–400. All other sizes scale from this.
            disc_radius: undefined, // px override — omit to auto-scale with card_size
            handle_radius: undefined, // px override — omit to auto-scale with card_size
            value_label: { show: true, size: "22px", weight: 500 },
            min_label: { show: true },
            max_label: { show: true },
        };
    }
    static getConfigElement() {
        return document.createElement("neumorphic-rotary-slider-editor");
    }
}
// ── Editor ────────────────────────────────────────────────────────────────────
//
// Custom HTML editor — collapsible sections, color swatches, font picker with
// Google Fonts presets, range sliders with live value display, toggle switches.
// Fires "config-changed" on every change, always preserving `type`.
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
  input[type=text],input[type=number],select {
    width:100%; padding:8px 10px; border-radius:6px;
    border:1px solid var(--divider-color,#d1d5db);
    background:var(--card-background-color,#fff);
    color:var(--primary-text-color,#111);
    font-size:13px; box-sizing:border-box; font-family:inherit;
    transition:border-color .15s;
  }
  input[type=text]:focus,input[type=number]:focus,select:focus { outline:none; border-color:var(--primary-color,#2196f3); }
  .field { margin-bottom:8px; }
  .row2 { display:flex; gap:8px; margin-bottom:8px; }
  .row2 > * { flex:1; min-width:0; }
  .row3 { display:flex; gap:6px; margin-bottom:8px; }
  .row3 > * { flex:1; min-width:0; }
  .range-wrap { display:flex; align-items:center; gap:8px; }
  .range-wrap input[type=range] { flex:1; accent-color:var(--primary-color,#2196f3); }
  .range-val { font-size:12px; font-weight:700; color:var(--primary-color,#2196f3); min-width:36px; text-align:right; font-family:monospace; }
  .tog-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; margin-bottom:6px; }
  .tog-row label { margin:0; }
  .switch { position:relative; display:inline-block; width:36px; height:20px; flex-shrink:0; }
  .switch input { opacity:0; width:0; height:0; }
  .sw-track { position:absolute; cursor:pointer; inset:0; border-radius:20px; background:var(--divider-color,#ccc); transition:.2s; }
  .sw-track::before { content:""; position:absolute; height:14px; width:14px; left:3px; bottom:3px; border-radius:50%; background:#fff; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  input:checked + .sw-track { background:var(--primary-color,#2196f3); }
  input:checked + .sw-track::before { transform:translateX(16px); }
  .color-field { display:flex; align-items:center; gap:6px; }
  .color-swatch { width:32px; height:32px; border-radius:6px; flex-shrink:0; border:1px solid var(--divider-color,#d1d5db); cursor:pointer; position:relative; overflow:hidden; }
  .color-swatch input[type=color] { position:absolute; inset:-4px; width:calc(100% + 8px); height:calc(100% + 8px); opacity:0; cursor:pointer; padding:0; border:none; }
  .color-field input[type=text] { flex:1; font-family:monospace; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
  .font-hint { font-size:10px; color:var(--secondary-text-color,#8891a0); margin-top:2px; display:block; }
  ha-entity-picker { display:block; width:100%; margin-bottom:8px; }
`;
const FONT_PRESETS = [
    { v: "", l: "Default (theme)" }, { v: "system-ui", l: "System UI" }, { v: "Arial", l: "Arial" },
    { v: "Helvetica Neue", l: "Helvetica Neue" }, { v: "Georgia", l: "Georgia" },
    { v: "Times New Roman", l: "Times New Roman" }, { v: "Courier New", l: "Courier New" },
    { v: "Roboto", l: "Roboto" }, { v: "Open Sans", l: "Open Sans" }, { v: "Lato", l: "Lato" },
    { v: "Montserrat", l: "Montserrat" }, { v: "Raleway", l: "Raleway" }, { v: "Poppins", l: "Poppins" },
    { v: "Nunito", l: "Nunito" }, { v: "Oswald", l: "Oswald" }, { v: "Playfair Display", l: "Playfair Display" },
    { v: "Merriweather", l: "Merriweather" }, { v: "Ubuntu", l: "Ubuntu" }, { v: "Inter", l: "Inter" },
    { v: "Source Sans Pro", l: "Source Sans Pro" }, { v: "Exo 2", l: "Exo 2" },
    { v: "Josefin Sans", l: "Josefin Sans" }, { v: "Quicksand", l: "Quicksand" },
    { v: "__custom__", l: "✏ Custom…" },
];
const WEB_SAFE = new Set(["", "system-ui", "Arial", "Helvetica Neue", "Georgia", "Times New Roman", "Courier New", "monospace", "serif", "sans-serif"]);
class NeumorphicRotarySliderCardEditor extends HTMLElement {
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
        (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelectorAll("ha-entity-picker").forEach(el => { el.hass = hass; });
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
            detail: { config: Object.assign({}, this._config) }, bubbles: true, composed: true,
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
            href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700&display=swap`,
        });
        document.head.appendChild(link);
    }
    _toggleSection(id) {
        var _a, _b;
        this._sections[id] = !this._sections[id];
        (_a = this.shadowRoot.querySelector(`[data-sec="${id}"]`)) === null || _a === void 0 ? void 0 : _a.classList.toggle("collapsed", !!this._sections[id]);
        (_b = this.shadowRoot.querySelector(`[data-secbody="${id}"]`)) === null || _b === void 0 ? void 0 : _b.classList.toggle("hidden", !!this._sections[id]);
    }
    // ── HTML builders ─────────────────────────────────────────────────────────
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
    _num(path, lbl, min, max, step = 1) {
        return `<div class="field"><label>${lbl}</label>
      <input type="number" data-path="${path}" value="${this._get(path, "")}" min="${min}" max="${max}" step="${step}">
    </div>`;
    }
    _range(path, lbl, min, max, step, suffix = "") {
        const v = Number(this._get(path, min));
        return `<div class="field"><label>${lbl}</label>
      <div class="range-wrap">
        <input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}">
        <span class="range-val" data-rv="${path}">${v}${suffix}</span>
      </div></div>`;
    }
    _select(path, lbl, opts) {
        const cur = String(this._get(path, opts[0].value));
        return `<div class="field"><label>${lbl}</label>
      <select data-path="${path}">${opts.map(o => `<option value="${o.value}"${cur === o.value ? " selected" : ""}>${o.label}</option>`).join("")}</select>
    </div>`;
    }
    _toggle(path, lbl) {
        return `<div class="tog-row"><label>${lbl}</label>
      <label class="switch"><input type="checkbox" data-path="${path}"${Boolean(this._get(path, false)) ? " checked" : ""}><span class="sw-track"></span></label>
    </div>`;
    }
    _color(path, lbl, def = "#2196f3") {
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
        const isC = cur !== "" && !FONT_PRESETS.find(p => p.v === cur && p.v !== "__custom__");
        const sel = isC ? "__custom__" : cur;
        return `<div class="field"><label>${lbl}</label>
      <select data-path="${path}" data-font-sel>
        ${FONT_PRESETS.map(p => `<option value="${p.v}"${sel === p.v ? " selected" : ""}>${p.l}</option>`).join("")}
      </select>
      <input type="text" data-path="${path}" data-font-custom placeholder="e.g. Dancing Script"
        style="${isC ? "" : "display:none"}" value="${isC ? cur : ""}">
      <small class="font-hint">Google Fonts load automatically when selected.</small>
    </div>`;
    }
    _labelBlock(prefix, hasText = true) {
        return `
      ${this._toggle(`${prefix}.show`, "Visible")}
      ${hasText ? this._text(`${prefix}.text`, "Text override", "blank = auto") : ""}
      <div class="row2">
        ${this._text(`${prefix}.size`, "Size (e.g. 13px)", "13px")}
        ${this._select(`${prefix}.weight`, "Weight", [
            { value: "300", label: "300" }, { value: "400", label: "400" }, { value: "500", label: "500" },
            { value: "600", label: "600" }, { value: "700", label: "700" },
        ])}
      </div>
      ${this._font(`${prefix}.font`, "Font family")}
      ${this._color(`${prefix}.color`, "Color", "#888888")}
      <div class="row2">
        ${this._select(`${prefix}.transform`, "Transform", [
            { value: "", label: "None" }, { value: "uppercase", label: "Uppercase" },
            { value: "lowercase", label: "Lowercase" }, { value: "capitalize", label: "Capitalize" },
        ])}
        ${this._text(`${prefix}.spacing`, "Letter spacing", "0.08em")}
      </div>`;
    }
    // ── Main render ───────────────────────────────────────────────────────────
    _render() {
        const sr = this.shadowRoot;
        const entityVal = String(this._get("entity", ""));
        const entityEl = customElements.get("ha-entity-picker")
            ? `<ha-entity-picker data-path="entity" value="${entityVal}" allow-custom-entity></ha-entity-picker>`
            : this._text("entity", "Entity", "sensor.my_sensor");
        const html = `
    ${this._sec("entity", "🔌 Entity & Service", `
      ${entityEl}
      ${this._text("attribute", "Attribute (optional)", "e.g. volume_level")}
      <div class="row2">
        ${this._text("service", "Service", "e.g. media_player.volume_set")}
        ${this._text("service_data_key", "Data key", "value")}
      </div>
      ${this._num("scale", "Scale", 0.0001, 100, 0.001)}
    `)}
    ${this._sec("range", "📐 Range & Value", `
      <div class="row3">
        ${this._num("min", "Min", -9999, 9999)}
        ${this._num("max", "Max", -9999, 9999)}
        ${this._num("step", "Step", 0.001, 1000, 0.001)}
      </div>
      ${this._text("unit", "Unit", "e.g. %")}
      ${this._select("value_position", "Value position", [
            { value: "below", label: "Below" }, { value: "center", label: "Center" },
        ])}
    `)}
    ${this._sec("knob", "⬤ Knob Geometry", `
      ${this._range("card_size", "Card size — diameter (px)", 100, 400, 10, "px")}
      ${this._range("disc_radius", "Disc radius (px)", 40, 115, 1, "px")}
      ${this._range("handle_radius", "Handle radius (px)", 8, 40, 1, "px")}
      ${this._toggle("disc_3d", "3D convex shading")}
      ${this._toggle("no_border", "No border / transparent background")}
      ${this._toggle("display_only", "Display only — show value, no interaction")}
    `)}
    ${this._sec("glow", "✨ Glow", `
      ${this._color("glow_color", "Glow colour", "#2196f3")}
      ${this._range("glow_intensity", "Glow intensity", 0, 1, 0.05, "")}
    `)}
    ${this._sec("angles", "🔄 Angular Range", `
      <small class="font-hint" style="display:block;margin-bottom:8px">0=bottom · 90=left · 180=top · 270=right</small>
      ${this._range("zero_angle", "Zero angle", 0, 359, 1, "°")}
      <div class="row2">
        ${this._range("min_angle", "Min angle", 0, 359, 1, "°")}
        ${this._range("max_angle", "Max angle", 1, 719, 1, "°")}
      </div>
    `)}
    ${this._sec("rstyle", "〰 Range Style", `
      ${this._select("range_style", "Style", [
            { value: "none", label: "None" }, { value: "progress", label: "Progress arc" },
            { value: "dial_ticks", label: "Dial ticks" },
        ])}
      ${this._range("dial_ticks", "Dial tick count", 5, 41, 1, "")}
      ${this._color("progress_color", "Progress colour", "#2196f3")}
      ${this._color("progress_color_end", "Gradient end (blank=solid)", "#32d48e")}
      ${this._select("markers", "Endpoint markers", [
            { value: "none", label: "None" }, { value: "ticks", label: "Ticks" },
            { value: "trail", label: "Trail" }, { value: "dots", label: "Dots" },
            { value: "ghosts", label: "Ghosts" }, { value: "combined", label: "Combined" },
        ])}
    `)}
    ${this._sec("title_lbl", "𝗔 Major Label", this._labelBlock("title_label", true))}
    ${this._sec("minor_lbl", "ᴬ Minor Label", this._labelBlock("minor_label", true))}
    ${this._sec("value_lbl", "# Value Label", this._labelBlock("value_label", false))}
    ${this._sec("min_lbl", "↙ Min Caption", this._labelBlock("min_label", true))}
    ${this._sec("min_val_lbl", "↙ Min Value", this._labelBlock("min_value_label", false))}
    ${this._sec("max_lbl", "↗ Max Caption", this._labelBlock("max_label", true))}
    ${this._sec("max_val_lbl", "↗ Max Value", this._labelBlock("max_value_label", false))}
    `;
        const style = document.createElement("style");
        style.textContent = EDITOR_CSS;
        const div = document.createElement("div");
        div.innerHTML = html;
        // Text & number
        div.querySelectorAll("input[type=text][data-path]:not(.color-hex):not([data-font-custom]),input[type=number][data-path]").forEach(el => el.addEventListener("change", () => {
            let v = el.type === "number"
                ? (el.value === "" ? undefined : Number(el.value))
                : el.value;
            // Auto-append "px" for size fields if user types a bare number (e.g. "13" → "13px")
            if (el.type === "text" && typeof v === "string" && el.dataset.path.endsWith(".size")) {
                if (v !== "" && /^\d+(\.\d+)?$/.test(v))
                    v = v + "px";
            }
            this._set(el.dataset.path, v);
            this._render();
        }));
        // Selects
        div.querySelectorAll("select[data-path]").forEach(sel => {
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
                this._set(sel.dataset.path, sel.value);
                this._render();
            });
        });
        // Custom font inputs
        div.querySelectorAll("input[data-font-custom]").forEach(el => {
            el.addEventListener("change", () => {
                if (el.value.trim())
                    this._loadFont(el.value.trim());
                this._set(el.dataset.path, el.value.trim());
                this._render();
            });
        });
        // Checkboxes
        div.querySelectorAll("input[type=checkbox][data-path]").forEach(el => {
            el.addEventListener("change", () => { this._set(el.dataset.path, el.checked); this._render(); });
        });
        // Ranges
        div.querySelectorAll("input[type=range][data-path]").forEach(el => {
            el.addEventListener("input", () => {
                const rv = div.querySelector(`[data-rv="${el.dataset.path}"]`);
                if (rv)
                    rv.textContent = el.value + (el.dataset.suffix || "");
            });
            el.addEventListener("change", () => { this._set(el.dataset.path, Number(el.value)); this._render(); });
        });
        // Color fields
        div.querySelectorAll(".color-field[data-colorpath]").forEach(field => {
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
        // Section headers
        div.querySelectorAll(".sec-hdr[data-sec]").forEach(el => {
            el.addEventListener("click", () => this._toggleSection(el.dataset.sec));
        });
        // Entity picker
        const ep = div.querySelector("ha-entity-picker");
        if (ep) {
            if (this._hass)
                ep.hass = this._hass;
            ep.addEventListener("value-changed", (e) => {
                this._set("entity", e.detail.value);
                this._render();
            });
        }
        sr.innerHTML = "";
        sr.appendChild(style);
        sr.appendChild(div);
    }
}
customElements.define("neumorphic-rotary-slider-editor", NeumorphicRotarySliderCardEditor);
// ── Register ──────────────────────────────────────────────────────────────────
customElements.define("neumorphic-rotary-slider", NeumorphicRotarySliderCard);
(_a = (_b = window).customCards) !== null && _a !== void 0 ? _a : (_b.customCards = []);
window.customCards.push({
    type: "neumorphic-rotary-slider",
    name: "Neumorphic Rotary Slider",
    description: "Circular knob slider — fully configurable labels, Neumorphic theme",
});
