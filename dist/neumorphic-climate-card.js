"use strict";
/**
 * Neumorphic Climate Card  v1.0
 * ─────────────────────────────
 * A soft-UI thermostat card for Home Assistant climate entities.
 * Compatible with the Neumorphic theme (etnlbck/hacs-neumorphic-template).
 *
 * Design: a raised neumorphic disc with a cold→warm gradient arc ring and a
 * draggable handle. Big target temperature in the centre, current temperature
 * beneath it. Full standard-climate controls: HVAC modes, presets, fan modes,
 * swing modes, humidity — everything the entity exposes.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  type: custom:neumorphic-climate-card                         │
 * │  entity: climate.living_room       # required                 │
 * │  name: "Living Room"               # optional title override  │
 * │  card_size: 320                    # base width px, 240–520    │
 * │  show_current_as_primary: false    # swap big/small numbers   │
 * │  show_modes: true                  # HVAC mode buttons        │
 * │  show_presets: true                # preset buttons           │
 * │  show_fan: true                    # fan mode buttons         │
 * │  show_swing: true                  # swing mode buttons       │
 * │  show_humidity: true               # humidity readout if any  │
 * │  show_unit_toggle: false           # °F/°C display toggle     │
 * │  display_only: false               # hide the drag handle     │
 * └──────────────────────────────────────────────────────────────┘
 */
var _a;

// ── Palettes ────────────────────────────────────────────────────────────────
const C_DARK = {
    bg: "#23272e", surface: "#23272e",
    shadowDark: "#181a1f", shadowLight: "#2c3140",
    textPrimary: "#e6e8ec", textSecondary: "#9aa0aa", textFaint: "#5a606c",
    discFrom: "#262b33", discTo: "#1f232a",
};
const C_LIGHT = {
    bg: "#eef1f4", surface: "#eef1f4",
    shadowDark: "#d5d8dd", shadowLight: "#ffffff",
    textPrimary: "#8a929e", textSecondary: "#aeb5c0", textFaint: "#c3c9d2",
    discFrom: "#fbfcfd", discTo: "#f4f6f8",
};

// Cold → warm gradient stops for the ring (soft pastel, matching the reference).
const RING_STOPS = [
    { off: 0.00, col: "#a9d4e6" }, // pale blue
    { off: 0.24, col: "#b7ddd4" }, // soft blue-green
    { off: 0.48, col: "#cfdcc0" }, // muted green-grey
    { off: 0.66, col: "#efd9ad" }, // pale sand
    { off: 0.84, col: "#eec5a3" }, // soft peach
    { off: 1.00, col: "#e6b3a6" }, // muted salmon
];

// HVAC mode → icon (MDI path data, inlined so no icon dependency).
const HVAC_ICON = {
    off:       "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14z",
    heat:      "M12 2c1 3-1 4-1 6a3 3 0 006 0c0-3-3-4-5-6zm-2 9a5 5 0 104 0",
    cool:      "M11 2h2v20h-2z M2 11h20v2H2z M5 5l14 14 M19 5L5 19",
    heat_cool: "M12 2v20 M4 8l16 8 M20 8L4 16",
    auto:      "M12 3a9 9 0 100 18 9 9 0 000-18z",
    dry:       "M12 3c3 4 5 7 5 10a5 5 0 01-10 0c0-3 2-6 5-10z",
    fan_only:  "M12 12a3 3 0 013-3c2 0 4 1 4 3 M12 12a3 3 0 01-3 3c-2 0-4-1-4-3 M12 12a3 3 0 01-3-3c0-2 1-4 3-4 M12 12a3 3 0 013 3c0 2-1 4-3 4",
};
const HVAC_LABEL = {
    off: "Off", heat: "Heat", cool: "Cool", heat_cool: "Heat/Cool",
    auto: "Auto", dry: "Dry", fan_only: "Fan",
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
function round1(v) { return Math.round(v * 10) / 10; }

// SVG arc path from angle a0 to a1 (degrees, 0° = 12 o'clock, clockwise).
function arcPath(cx, cy, r, a0, a1) {
    const p0 = polar(cx, cy, r, a0);
    const p1 = polar(cx, cy, r, a1);
    const large = (a1 - a0) % 360 > 180 ? 1 : 0;
    return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}
function polar(cx, cy, r, deg) {
    const rad = (deg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

class NeumorphicClimateCard extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._config = null;
        this._rawConfig = null;
        this._isDark = true;
        this._hassReady = false;
        this._dragging = false;
        this._pendingTarget = null;   // optimistic value while dragging
        this._pendingTimer = null;
        this._unit = null;            // display unit override (°F/°C) — visual only
        this._themeObserver = null;
        this._bound_move = (e) => this._onMove(e);
        this._bound_up = (e) => this._onUp(e);
    }

    // ── HA interface ──────────────────────────────────────────────────────────
    setConfig(config) {
        if (!config.entity) throw new Error("neumorphic-climate-card: 'entity' is required");
        this._rawConfig = config;
        this._config = Object.assign({
            card_size: 320,
            show_current_as_primary: false,
            show_modes: true,
            show_presets: true,
            show_fan: true,
            show_swing: true,
            show_humidity: true,
            show_status_pill: true,
            show_unit_toggle: false,
            display_only: false,
        }, config);
        if (this.shadowRoot) {
            this._updateStyle();
            this._render();
        }
    }

    set hass(hass) {
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        if (!this._hassReady) {
            this._hassReady = true;
            this._build();
            this._watchTheme();
        }
        if (this.shadowRoot) {
            this._updateStyle();
            this._render();
        }
    }

    getCardSize() { return 6; }

    static getStubConfig(hass) {
        let ent = "climate.living_room";
        if (hass && hass.states) {
            const first = Object.keys(hass.states).find((e) => e.startsWith("climate."));
            if (first) ent = first;
        }
        return { entity: ent };
    }
    static getConfigElement() { return document.createElement("neumorphic-climate-editor"); }

    // ── Geometry ──────────────────────────────────────────────────────────────
    get KS() {
        var _a, _b;
        return clamp((_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.card_size) !== null && _b !== void 0 ? _b : 320, 240, 520);
    }
    get SCALE() { return this.KS / 320; }

    // The ring spans 330°, centred at top, leaving a small 30° gap at the bottom.
    get ARC_START() { return -165; }  // degrees from 12 o'clock
    get ARC_END() { return 165; }
    get ARC_SPAN() { return this.ARC_END - this.ARC_START; } // 330

    // ── State helpers ─────────────────────────────────────────────────────────
    get _stateObj() {
        var _a, _b;
        const ent = (_a = this._config) === null || _a === void 0 ? void 0 : _a.entity;
        return ent && ((_b = this._hass) === null || _b === void 0 ? void 0 : _b.states) ? this._hass.states[ent] : null;
    }
    _attr(name, fb) {
        const s = this._stateObj;
        return s && s.attributes[name] !== undefined ? s.attributes[name] : fb;
    }
    get _minTemp() { return Number(this._attr("min_temp", 7)); }
    get _maxTemp() { return Number(this._attr("max_temp", 35)); }
    get _step() { return Number(this._attr("target_temp_step", 0.5)); }
    get _isRange() {
        const s = this._stateObj;
        return !!s && s.state === "heat_cool"
            && this._attr("target_temp_low") !== undefined
            && this._attr("target_temp_high") !== undefined;
    }
    get _target() {
        if (this._pendingTarget !== null) return this._pendingTarget;
        return Number(this._attr("temperature", (this._minTemp + this._maxTemp) / 2));
    }
    get _current() {
        const c = this._attr("current_temperature");
        return c === undefined ? null : Number(c);
    }

    // ── DOM build ─────────────────────────────────────────────────────────────
    _build() {
        if (this.shadowRoot) return;
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.id = "neu-style";
        const card = document.createElement("ha-card");
        card.id = "root";
        card.innerHTML = `
      <div class="head">
        <div class="title" id="c-title"></div>
        <div class="action" id="c-action"></div>
      </div>
      <div class="dial-wrap" id="dial-wrap"></div>
      <div class="status-pill" id="status-pill"></div>
      <div class="unit-toggle" id="unit-toggle"></div>
      <div class="controls" id="controls"></div>`;
        shadow.appendChild(style);
        shadow.appendChild(card);
        this._updateStyle(style);
    }

    _updateStyle(styleEl) {
        var _a;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el) return;
        const p = this._isDark ? C_DARK : C_LIGHT;
        const sc = this.SCALE;
        const pad = Math.round(22 * sc);
        const softOut = `${Math.round(6 * sc)}px ${Math.round(6 * sc)}px ${Math.round(14 * sc)}px ${p.shadowDark}, -${Math.round(6 * sc)}px -${Math.round(6 * sc)}px ${Math.round(14 * sc)}px ${p.shadowLight}`;
        const softOutSm = `${Math.round(4 * sc)}px ${Math.round(4 * sc)}px ${Math.round(9 * sc)}px ${p.shadowDark}, -${Math.round(4 * sc)}px -${Math.round(4 * sc)}px ${Math.round(9 * sc)}px ${p.shadowLight}`;
        const softIn = `inset ${Math.round(3 * sc)}px ${Math.round(3 * sc)}px ${Math.round(7 * sc)}px ${p.shadowDark}, inset -${Math.round(3 * sc)}px -${Math.round(3 * sc)}px ${Math.round(7 * sc)}px ${p.shadowLight}`;
        const cfg = this._config || {};
        el.textContent = `
      :host { display:block; }
      ha-card {
        display:flex; flex-direction:column; align-items:stretch;
        padding:${pad}px; box-sizing:border-box; width:100%;
        background:${cfg.no_border ? "transparent" : `var(--ha-card-background, var(--card-background-color, ${p.bg}))`};
        border-radius:${cfg.no_border ? "0" : "var(--ha-card-border-radius, 24px)"};
        box-shadow:${cfg.no_border ? "none" : `var(--ha-card-box-shadow, ${softOut})`};
        color:${p.textPrimary};
        --c-surface:${p.surface}; --c-sd:${p.shadowDark}; --c-sl:${p.shadowLight};
        --c-soft-out:${softOutSm}; --c-soft-in:${softIn};
        --c-txt:${p.textPrimary}; --c-txt2:${p.textSecondary}; --c-faint:${p.textFaint};
      }
      .head { display:flex; align-items:center; justify-content:space-between; margin-bottom:${Math.round(6 * sc)}px; min-height:${Math.round(22 * sc)}px; }
      .title { font-family:var(--primary-font-family,"Space Mono",monospace); font-size:${(12.5 * sc).toFixed(1)}px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:${p.textSecondary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .action { font-family:var(--primary-font-family,"Space Mono",monospace); font-size:${(10.5 * sc).toFixed(1)}px; letter-spacing:0.06em; text-transform:uppercase; color:${p.textFaint}; display:flex; align-items:center; gap:${Math.round(5 * sc)}px; }
      .action .dot { width:${Math.round(8 * sc)}px; height:${Math.round(8 * sc)}px; border-radius:50%; background:${p.textFaint}; }
      .action.heating .dot { background:#ef7a5f; box-shadow:0 0 ${Math.round(7*sc)}px #ef7a5f; }
      .action.cooling .dot { background:#4aa3df; box-shadow:0 0 ${Math.round(7*sc)}px #4aa3df; }
      .action.idle .dot,.action.off .dot { background:${p.textFaint}; }
      .action.drying .dot { background:#f2c14e; }
      .action.fan .dot { background:#57c9c2; }

      .dial-wrap { position:relative; width:100%; display:flex; align-items:center; justify-content:center; margin:${Math.round(4 * sc)}px 0 ${Math.round(10 * sc)}px; touch-action:none; }
      .dial-wrap svg { width:100%; height:auto; display:block; overflow:visible; }
      .dial-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none; }
      .t-primary { font-family:var(--primary-font-family,"Space Mono",monospace); font-weight:300; color:${p.textPrimary}; line-height:1; font-size:${Math.round(58 * sc)}px; letter-spacing:-0.02em; }
      .t-secondary { font-family:var(--primary-font-family,"Space Mono",monospace); font-weight:400; color:${p.textFaint}; font-size:${Math.round(16 * sc)}px; margin-top:${Math.round(6 * sc)}px; }
      .t-unit { font-size:0.5em; color:${p.textSecondary}; vertical-align:top; margin-left:2px; }
      .range-row { display:flex; gap:${Math.round(18*sc)}px; align-items:baseline; }
      .range-row .t-primary { font-size:${Math.round(38 * sc)}px; }
      .range-lo { color:#4aa3df; } .range-hi { color:#e2685f; }

      .handle { cursor:${cfg.display_only ? "default" : "grab"}; }
      .handle:active { cursor:${cfg.display_only ? "default" : "grabbing"}; }
      ${cfg.display_only ? ".handle{display:none;}" : ""}

      .unit-toggle { display:flex; justify-content:center; gap:${Math.round(6*sc)}px; margin-bottom:${Math.round(12*sc)}px; }
      .unit-toggle.hidden { display:none; }

      .status-pill { display:flex; justify-content:center; margin:${Math.round(2*sc)}px 0 ${Math.round(14*sc)}px; }
      .status-pill.hidden { display:none; }
      .pill {
        display:inline-flex; align-items:center; gap:${Math.round(7*sc)}px;
        font-family:var(--primary-font-family,"Space Mono",monospace);
        font-size:${(10.5*sc).toFixed(1)}px; font-weight:600; letter-spacing:0.04em;
        color:#fff; border-radius:${Math.round(20*sc)}px;
        padding:${Math.round(7*sc)}px ${Math.round(14*sc)}px;
        box-shadow:0 ${Math.round(4*sc)}px ${Math.round(10*sc)}px rgba(0,0,0,0.14);
        -webkit-tap-highlight-color:transparent;
        cursor:${cfg.display_only ? "default" : "pointer"};
        transition:transform .06s ease, filter .12s ease;
      }
      .pill:active { transform:translateY(0.5px); }
      .pill svg { width:${Math.round(14*sc)}px; height:${Math.round(14*sc)}px; fill:#fff; }
      .pill.off { background:${p.textFaint}; color:#fff; }
      .pill.idle { background:#8bbf82; }
      .pill.heating { background:#e08a6f; }
      .pill.cooling { background:#5aa9d6; }
      .pill.drying { background:#e6c05a; }
      .pill.fan { background:#5cc3bc; }
      ${cfg.display_only ? ".pill{pointer-events:none;}" : ""}
      .unit-btn { font-family:var(--primary-font-family,"Space Mono",monospace); font-size:${(11*sc).toFixed(1)}px; font-weight:600; color:${p.textFaint}; background:${p.surface}; border:none; border-radius:${Math.round(9*sc)}px; padding:${Math.round(5*sc)}px ${Math.round(11*sc)}px; cursor:pointer; box-shadow:${softOutSm}; -webkit-tap-highlight-color:transparent; }
      .unit-btn.on { color:${p.textPrimary}; box-shadow:${softIn}; }

      .controls { display:flex; flex-direction:column; gap:${Math.round(14 * sc)}px; }
      .ctrl-group { }
      .ctrl-label { font-family:var(--primary-font-family,"Space Mono",monospace); font-size:${(9.5 * sc).toFixed(1)}px; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; color:${p.textFaint}; margin-bottom:${Math.round(7 * sc)}px; padding-left:${Math.round(2*sc)}px; }
      .chips { display:flex; flex-wrap:wrap; gap:${Math.round(8 * sc)}px; }
      .chip {
        display:inline-flex; align-items:center; justify-content:center; gap:${Math.round(6*sc)}px;
        font-family:var(--primary-font-family,"Space Mono",monospace);
        font-size:${(11 * sc).toFixed(1)}px; font-weight:600;
        color:${p.textSecondary}; background:${p.surface};
        border:none; border-radius:${Math.round(12 * sc)}px;
        padding:${Math.round(9 * sc)}px ${Math.round(13 * sc)}px; min-width:${Math.round(40*sc)}px;
        cursor:${cfg.display_only ? "default" : "pointer"};
        box-shadow:${softOutSm};
        transition:box-shadow .12s ease, color .12s ease, transform .05s ease;
        -webkit-tap-highlight-color:transparent;
      }
      .chip svg { width:${Math.round(16*sc)}px; height:${Math.round(16*sc)}px; fill:none; stroke:currentColor; stroke-width:1.6; }
      .chip.icon-only { padding:${Math.round(9*sc)}px; min-width:0; }
      .chip:active { transform:translateY(0.5px); }
      .chip.active { color:${p.textPrimary}; box-shadow:${softIn}; }
      .chip.active.m-heat { color:#e2685f; } .chip.active.m-cool { color:#4aa3df; }
      .chip.active.m-heat_cool { color:#8bd07a; } .chip.active.m-dry { color:#f2c14e; }
      .chip.active.m-fan_only { color:#57c9c2; } .chip.active.m-auto,.chip.active.m-off { color:${p.textPrimary}; }
      ${cfg.display_only ? ".chip{pointer-events:none;}" : ""}
      .humidity { font-family:var(--primary-font-family,"Space Mono",monospace); font-size:${(11*sc).toFixed(1)}px; color:${p.textSecondary}; display:flex; align-items:center; gap:${Math.round(6*sc)}px; padding-left:${Math.round(2*sc)}px; }
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
    disconnectedCallback() {
        var _a;
        (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        window.removeEventListener("mousemove", this._bound_move);
        window.removeEventListener("touchmove", this._bound_move);
        window.removeEventListener("mouseup", this._bound_up);
        window.removeEventListener("touchend", this._bound_up);
    }

    // ── Display-unit conversion (visual only) ─────────────────────────────────
    get _entityUnit() {
        var _a, _b;
        return ((_b = (_a = this._hass) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.unit_system && this._hass.config.unit_system.temperature) || "°C";
    }
    _dispUnit() {
        if (this._unit) return this._unit;
        return this._entityUnit.includes("F") ? "°F" : "°C";
    }
    _toDisplay(v) {
        if (v === null || v === undefined) return v;
        const entF = this._entityUnit.includes("F");
        const dispF = this._dispUnit() === "°F";
        if (entF === dispF) return v;
        return dispF ? v * 9 / 5 + 32 : (v - 32) * 5 / 9;
    }

    // ── Render ────────────────────────────────────────────────────────────────
    _render() {
        if (!this.shadowRoot || !this._config) return;
        const sr = this.shadowRoot;
        const s = this._stateObj;
        const titleEl = sr.getElementById("c-title");
        const actionEl = sr.getElementById("c-action");

        if (!s) {
            if (titleEl) titleEl.textContent = this._config.name || this._config.entity || "Climate";
            if (actionEl) actionEl.innerHTML = `<span>unavailable</span>`;
            const dw = sr.getElementById("dial-wrap");
            if (dw) dw.innerHTML = "";
            const cc = sr.getElementById("controls");
            if (cc) cc.innerHTML = "";
            return;
        }

        // Title
        if (titleEl) titleEl.textContent = this._config.name || s.attributes.friendly_name || this._config.entity;

        // HVAC action status
        const action = s.attributes.hvac_action || (s.state === "off" ? "off" : "idle");
        if (actionEl) {
            actionEl.className = "action " + action;
            actionEl.innerHTML = `<span class="dot"></span><span>${action}</span>`;
        }

        this._renderDial();
        this._renderStatusPill();
        this._renderUnitToggle();
        this._renderControls();
    }

    _renderDial() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("dial-wrap");
        if (!wrap) return;
        const p = this._isDark ? C_DARK : C_LIGHT;
        const sc = this.SCALE;
        const S = 320; // internal viewBox units
        const cx = S / 2, cy = S / 2;
        const ringR = 138;
        const discR = 118;
        const a0 = this.ARC_START, a1 = this.ARC_END, span = this.ARC_SPAN;

        const lo = this._minTemp, hi = this._maxTemp;
        const target = clamp(this._target, lo, hi);
        const frac = (target - lo) / (hi - lo || 1);
        const ang = a0 + frac * span;
        const handle = polar(cx, cy, ringR, ang);

        const trackPath = arcPath(cx, cy, ringR, a0, a1);
        const uid = "ncg";

        // Numbers
        const dispTarget = round1(this._toDisplay(target));
        const cur = this._current;
        const dispCur = cur === null ? null : round1(this._toDisplay(cur));
        const unit = this._dispUnit();
        const primaryIsCurrent = this._config.show_current_as_primary && dispCur !== null;
        const bigVal = primaryIsCurrent ? dispCur : dispTarget;
        const smallVal = primaryIsCurrent ? dispTarget : dispCur;

        let centerHTML;
        if (this._isRange) {
            const tlo = round1(this._toDisplay(Number(this._attr("target_temp_low"))));
            const thi = round1(this._toDisplay(Number(this._attr("target_temp_high"))));
            centerHTML = `<div class="range-row">
                <span class="t-primary range-lo">${tlo}</span>
                <span class="t-primary range-hi">${thi}</span>
              </div>
              ${dispCur !== null ? `<div class="t-secondary">${dispCur}${unit}</div>` : ""}`;
        } else {
            centerHTML = `<div class="t-primary">${bigVal}<span class="t-unit">${unit}</span></div>
              ${smallVal !== null && smallVal !== undefined ? `<div class="t-secondary">${smallVal}${unit}</div>` : ""}`;
        }

        wrap.innerHTML = `
      <svg viewBox="0 0 ${S} ${S}" role="img" aria-label="temperature dial">
        <defs>
          <linearGradient id="${uid}-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            ${RING_STOPS.map(st => `<stop offset="${(st.off*100).toFixed(0)}%" stop-color="${st.col}"/>`).join("")}
          </linearGradient>
          <radialGradient id="${uid}-disc" cx="40%" cy="36%" r="82%">
            <stop offset="0%" stop-color="${p.discFrom}"/>
            <stop offset="100%" stop-color="${p.discTo}"/>
          </radialGradient>
          <filter id="${uid}-out" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="${3}" dy="${4}" stdDeviation="${7}" flood-color="${p.shadowDark}" flood-opacity="0.55"/>
            <feDropShadow dx="${-3}" dy="${-3}" stdDeviation="${6}" flood-color="${p.shadowLight}" flood-opacity="0.9"/>
          </filter>
          <filter id="${uid}-hout" x="-120%" y="-120%" width="340%" height="340%">
            <feDropShadow dx="${1}" dy="${1.5}" stdDeviation="${2.2}" flood-color="${p.shadowDark}" flood-opacity="0.55"/>
          </filter>
        </defs>

        <!-- faint recessed track under the ring -->
        <path d="${trackPath}" fill="none" stroke="${p.shadowDark}" stroke-opacity="0.30"
              stroke-width="3.5" stroke-linecap="round"/>
        <!-- colour ring (thin, pale) -->
        <path d="${trackPath}" fill="none" stroke="url(#${uid}-ring)"
              stroke-width="3.5" stroke-linecap="round"/>

        <!-- gently raised disc -->
        <circle cx="${cx}" cy="${cy}" r="${discR}" fill="url(#${uid}-disc)" filter="url(#${uid}-out)"/>

        <!-- draggable handle: solid white circle -->
        <g class="handle" id="dial-handle">
          <circle cx="${handle.x.toFixed(2)}" cy="${handle.y.toFixed(2)}" r="9.5"
                  fill="#ffffff" filter="url(#${uid}-hout)"/>
        </g>
      </svg>
      <div class="dial-center">${centerHTML}</div>`;

        // Drag wiring
        if (!this._config.display_only) {
            const svg = wrap.querySelector("svg");
            const down = (e) => this._onDown(e, svg, cx, cy);
            svg.addEventListener("mousedown", down);
            svg.addEventListener("touchstart", down, { passive: false });
        }
    }

    _renderStatusPill() {
        const sr = this.shadowRoot;
        const pill = sr.getElementById("status-pill");
        if (!pill) return;
        const s = this._stateObj;
        if (!s || this._config.show_status_pill === false) {
            pill.className = "status-pill hidden"; pill.innerHTML = ""; return;
        }
        pill.className = "status-pill";
        // hvac_action drives colour/label; fall back to state.
        const action = s.attributes.hvac_action || (s.state === "off" ? "off" : "idle");
        const label = this._cap(action);
        // Power icon (thermometer-like) — matches the reference's little glyph.
        const icon = `<svg viewBox="0 0 24 24"><path d="M13 4a3 3 0 00-6 0v7.5a5 5 0 106 0V4zm-3 14a3 3 0 01-1-5.8V4a1 1 0 012 0v8.2A3 3 0 0110 18z"/></svg>`;
        pill.innerHTML = `<button class="pill ${action}" id="pill-btn" title="${label}">${icon}<span>${label}</span></button>`;
        if (!this._config.display_only) {
            const btn = pill.querySelector("#pill-btn");
            if (btn) btn.addEventListener("click", () => this._togglePower());
        }
    }

    _togglePower() {
        if (!this._hass || !this._config) return;
        const s = this._stateObj;
        if (!s) return;
        const ent = this._config.entity;
        if (s.state === "off") {
            // Turn on: prefer a non-off mode the entity supports.
            const modes = (s.attributes.hvac_modes || []).filter((m) => m !== "off");
            const target = modes.includes("heat") ? "heat" : (modes[0] || "auto");
            this._hass.callService("climate", "set_hvac_mode", { entity_id: ent, hvac_mode: target });
        } else {
            this._hass.callService("climate", "set_hvac_mode", { entity_id: ent, hvac_mode: "off" });
        }
    }

    _renderUnitToggle() {
        const sr = this.shadowRoot;
        const ut = sr.getElementById("unit-toggle");
        if (!ut) return;
        if (!this._config.show_unit_toggle) { ut.className = "unit-toggle hidden"; ut.innerHTML = ""; return; }
        ut.className = "unit-toggle";
        const cur = this._dispUnit();
        ut.innerHTML = `
      <button class="unit-btn ${cur === "°F" ? "on" : ""}" data-unit="°F">°F</button>
      <button class="unit-btn ${cur === "°C" ? "on" : ""}" data-unit="°C">°C</button>`;
        ut.querySelectorAll(".unit-btn").forEach((b) => {
            b.addEventListener("click", () => { this._unit = b.dataset.unit; this._render(); });
        });
    }

    _renderControls() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("controls");
        if (!wrap) return;
        const s = this._stateObj;
        const cfg = this._config;
        let html = "";

        // HVAC modes
        const modes = this._attr("hvac_modes", []);
        if (cfg.show_modes && Array.isArray(modes) && modes.length) {
            html += `<div class="ctrl-group"><div class="ctrl-label">Mode</div><div class="chips">`;
            html += modes.map((m) => {
                const icon = HVAC_ICON[m] ? `<svg viewBox="0 0 24 24"><path d="${HVAC_ICON[m]}"/></svg>` : "";
                const lbl = HVAC_LABEL[m] || m;
                const active = s.state === m ? `active m-${m}` : "";
                return `<button class="chip ${active}" data-kind="hvac" data-val="${m}" title="${lbl}">${icon}<span>${lbl}</span></button>`;
            }).join("");
            html += `</div></div>`;
        }

        // Presets
        const presets = this._attr("preset_modes", []);
        const curPreset = this._attr("preset_mode");
        if (cfg.show_presets && Array.isArray(presets) && presets.length) {
            html += `<div class="ctrl-group"><div class="ctrl-label">Preset</div><div class="chips">`;
            html += presets.map((m) => {
                const active = curPreset === m ? "active" : "";
                return `<button class="chip ${active}" data-kind="preset" data-val="${m}">${this._cap(m)}</button>`;
            }).join("");
            html += `</div></div>`;
        }

        // Fan modes
        const fans = this._attr("fan_modes", []);
        const curFan = this._attr("fan_mode");
        if (cfg.show_fan && Array.isArray(fans) && fans.length) {
            html += `<div class="ctrl-group"><div class="ctrl-label">Fan</div><div class="chips">`;
            html += fans.map((m) => {
                const active = curFan === m ? "active" : "";
                return `<button class="chip ${active}" data-kind="fan" data-val="${m}">${this._cap(m)}</button>`;
            }).join("");
            html += `</div></div>`;
        }

        // Swing modes
        const swings = this._attr("swing_modes", []);
        const curSwing = this._attr("swing_mode");
        if (cfg.show_swing && Array.isArray(swings) && swings.length) {
            html += `<div class="ctrl-group"><div class="ctrl-label">Swing</div><div class="chips">`;
            html += swings.map((m) => {
                const active = curSwing === m ? "active" : "";
                return `<button class="chip ${active}" data-kind="swing" data-val="${m}">${this._cap(m)}</button>`;
            }).join("");
            html += `</div></div>`;
        }

        // Humidity
        const hum = this._attr("current_humidity");
        if (cfg.show_humidity && hum !== undefined) {
            html += `<div class="humidity"><span>Humidity</span><span>${hum}%</span></div>`;
        }

        wrap.innerHTML = html;

        if (!cfg.display_only) {
            wrap.querySelectorAll(".chip").forEach((btn) => {
                btn.addEventListener("click", () => this._onChip(btn.dataset.kind, btn.dataset.val));
            });
        }
    }

    _cap(s) { return typeof s === "string" ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : s; }

    // ── Interaction: dial drag ────────────────────────────────────────────────
    _onDown(e, svg, cx, cy) {
        e.preventDefault();
        this._dragging = true;
        this._svg = svg; this._cx = cx; this._cy = cy;
        window.addEventListener("mousemove", this._bound_move);
        window.addEventListener("touchmove", this._bound_move, { passive: false });
        window.addEventListener("mouseup", this._bound_up);
        window.addEventListener("touchend", this._bound_up);
        this._onMove(e);
    }
    _onMove(e) {
        if (!this._dragging || !this._svg) return;
        e.preventDefault();
        const pt = (e.touches && e.touches[0]) ? e.touches[0] : e;
        const rect = this._svg.getBoundingClientRect();
        // Map client coords into viewBox (0..320) space
        const vx = (pt.clientX - rect.left) / rect.width * 320;
        const vy = (pt.clientY - rect.top) / rect.height * 320;
        let deg = Math.atan2(vy - this._cy, vx - this._cx) * 180 / Math.PI + 90; // 0 = top
        if (deg > 180) deg -= 360;
        const a0 = this.ARC_START, a1 = this.ARC_END;
        deg = clamp(deg, a0, a1);
        const frac = (deg - a0) / (a1 - a0);
        const lo = this._minTemp, hi = this._maxTemp, step = this._step;
        let val = lo + frac * (hi - lo);
        val = Math.round(val / step) * step;
        val = clamp(round1(val), lo, hi);
        this._pendingTarget = val;
        this._renderDial();          // optimistic visual update
        this._scheduleSet(val);
    }
    _onUp() {
        if (!this._dragging) return;
        this._dragging = false;
        window.removeEventListener("mousemove", this._bound_move);
        window.removeEventListener("touchmove", this._bound_move);
        window.removeEventListener("mouseup", this._bound_up);
        window.removeEventListener("touchend", this._bound_up);
        if (this._pendingTarget !== null) this._commitSet(this._pendingTarget);
    }
    _scheduleSet(val) {
        if (this._pendingTimer) clearTimeout(this._pendingTimer);
        this._pendingTimer = setTimeout(() => this._commitSet(val), 350);
    }
    _commitSet(val) {
        if (this._pendingTimer) { clearTimeout(this._pendingTimer); this._pendingTimer = null; }
        if (!this._hass || !this._config) return;
        this._hass.callService("climate", "set_temperature", {
            entity_id: this._config.entity, temperature: val,
        });
        // Clear optimistic value shortly after so the real state takes over.
        setTimeout(() => { this._pendingTarget = null; }, 1200);
    }

    // ── Interaction: chips ────────────────────────────────────────────────────
    _onChip(kind, val) {
        if (!this._hass || !this._config) return;
        const ent = this._config.entity;
        if (kind === "hvac") this._hass.callService("climate", "set_hvac_mode", { entity_id: ent, hvac_mode: val });
        else if (kind === "preset") this._hass.callService("climate", "set_preset_mode", { entity_id: ent, preset_mode: val });
        else if (kind === "fan") this._hass.callService("climate", "set_fan_mode", { entity_id: ent, fan_mode: val });
        else if (kind === "swing") this._hass.callService("climate", "set_swing_mode", { entity_id: ent, swing_mode: val });
    }
}

// ── Editor ────────────────────────────────────────────────────────────────────
const CLIMATE_EDITOR_CSS = `
  :host { display:block; font-family:var(--paper-font-body1_-_font-family,sans-serif); }
  .sec-hdr { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--secondary-text-color,#8891a0); padding:14px 0 6px; border-bottom:1px solid var(--divider-color,rgba(0,0,0,.08)); margin-bottom:10px; }
  label { display:block; font-size:12px; color:var(--secondary-text-color,#6b7280); margin-bottom:3px; font-weight:500; }
  input[type=text],input[type=number],select { width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--divider-color,#d1d5db); background:var(--card-background-color,#fff); color:var(--primary-text-color,#111); font-size:13px; box-sizing:border-box; font-family:inherit; }
  input:focus,select:focus { outline:none; border-color:var(--primary-color,#4aa3df); }
  .field { margin-bottom:8px; }
  .range-wrap { display:flex; align-items:center; gap:8px; }
  .range-wrap input[type=range] { flex:1; accent-color:var(--primary-color,#4aa3df); }
  .range-val { font-size:12px; font-weight:700; color:var(--primary-color,#4aa3df); min-width:44px; text-align:right; font-family:monospace; }
  .tog-row { display:flex; align-items:center; justify-content:space-between; padding:4px 0; margin-bottom:6px; }
  .tog-row label { margin:0; }
  .switch { position:relative; display:inline-block; width:36px; height:20px; flex-shrink:0; }
  .switch input { opacity:0; width:0; height:0; }
  .sw-track { position:absolute; cursor:pointer; inset:0; border-radius:20px; background:var(--divider-color,#ccc); transition:.2s; }
  .sw-track::before { content:""; position:absolute; height:14px; width:14px; left:3px; bottom:3px; border-radius:50%; background:#fff; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.3); }
  input:checked + .sw-track { background:var(--primary-color,#4aa3df); }
  input:checked + .sw-track::before { transform:translateX(16px); }
  ha-entity-picker { display:block; width:100%; margin-bottom:8px; }
`;

class NeumorphicClimateCardEditor extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._config = {};
        this._built = false;
    }
    set hass(hass) {
        this._hass = hass;
        const ep = this.shadowRoot && this.shadowRoot.getElementById("entity_picker");
        if (ep) ep.hass = hass;
    }
    setConfig(config) {
        this._config = Object.assign({}, config);
        if (!this._built) { this.attachShadow({ mode: "open" }); this._built = true; }
        this._render();
    }
    _get(k, fb = "") { return this._config[k] !== undefined ? this._config[k] : fb; }
    _set(k, v) {
        const next = Object.assign({}, this._config);
        if (v === "" || v === null || v === undefined) delete next[k]; else next[k] = v;
        this._config = next;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
    }
    _entityPicker() {
        const v = this._get("entity");
        if (customElements.get("ha-entity-picker")) {
            return `<ha-entity-picker id="entity_picker" data-path="entity" .value="${v}" value="${v}" include-domains='["climate"]' allow-custom-entity></ha-entity-picker>`;
        }
        return `<input type="text" id="entity_txt" value="${v}" placeholder="climate.living_room">`;
    }
    _toggle(k, lbl, def = false) {
        return `<div class="tog-row"><label>${lbl}</label>
      <label class="switch"><input type="checkbox" data-tog="${k}"${this._get(k, def) ? " checked" : ""}><span class="sw-track"></span></label></div>`;
    }
    _range(k, lbl, min, max, stp, suf, def) {
        const v = Number(this._get(k, def));
        return `<div class="field"><label>${lbl}</label><div class="range-wrap">
      <input type="range" data-range="${k}" value="${v}" min="${min}" max="${max}" step="${stp}" data-suf="${suf}">
      <span class="range-val" data-rv="${k}">${v}${suf}</span></div></div>`;
    }
    _render() {
        const sr = this.shadowRoot;
        const html = `
      <div class="sec-hdr">Climate Entity</div>
      <div class="field"><label>Entity (climate.*)</label>${this._entityPicker()}</div>
      <div class="field"><label>Name (optional)</label>
        <input type="text" data-txt="name" value="${this._get("name")}" placeholder="Friendly name override"></div>

      <div class="sec-hdr">Layout</div>
      ${this._range("card_size", "Card width (px)", 240, 520, 10, "px", 320)}
      ${this._toggle("show_current_as_primary", "Show current temp as primary")}
      ${this._toggle("show_unit_toggle", "Show °F/°C toggle")}
      ${this._toggle("no_border", "No border / transparent background")}
      ${this._toggle("display_only", "Display only — hide drag handle")}

      <div class="sec-hdr">Controls</div>
      ${this._toggle("show_modes", "HVAC mode buttons", true)}
      ${this._toggle("show_presets", "Preset buttons", true)}
      ${this._toggle("show_fan", "Fan mode buttons", true)}
      ${this._toggle("show_swing", "Swing mode buttons", true)}
      ${this._toggle("show_humidity", "Humidity readout", true)}
      ${this._toggle("show_status_pill", "Status pill under dial", true)}
    `;
        const style = document.createElement("style");
        style.textContent = CLIMATE_EDITOR_CSS;
        const div = document.createElement("div");
        div.innerHTML = html;

        // entity picker / text
        const ep = div.querySelector("#entity_picker");
        if (ep) {
            ep.hass = this._hass;
            ep.addEventListener("value-changed", (e) => this._set("entity", e.detail.value));
        } else {
            const et = div.querySelector("#entity_txt");
            if (et) et.addEventListener("change", () => this._set("entity", et.value.trim() || undefined));
        }
        // text fields
        div.querySelectorAll("input[data-txt]").forEach((el) => {
            el.addEventListener("change", () => this._set(el.dataset.txt, el.value.trim() || undefined));
        });
        // toggles
        div.querySelectorAll("input[data-tog]").forEach((el) => {
            el.addEventListener("change", () => this._set(el.dataset.tog, el.checked));
        });
        // ranges
        div.querySelectorAll("input[data-range]").forEach((el) => {
            el.addEventListener("input", () => {
                const rv = div.querySelector(`[data-rv="${el.dataset.range}"]`);
                if (rv) rv.textContent = el.value + (el.dataset.suf || "");
            });
            el.addEventListener("change", () => this._set(el.dataset.range, Number(el.value)));
        });

        sr.innerHTML = "";
        sr.appendChild(style);
        sr.appendChild(div);
    }
}

customElements.define("neumorphic-climate-editor", NeumorphicClimateCardEditor);
customElements.define("neumorphic-climate-card", NeumorphicClimateCard);
window.customCards = (_a = window.customCards) !== null && _a !== void 0 ? _a : [];
window.customCards.push({
    type: "neumorphic-climate-card",
    name: "Neumorphic Climate",
    description: "Soft-UI thermostat with gradient dial and full climate controls — Neumorphic theme",
    preview: true,
});
