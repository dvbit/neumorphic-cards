"use strict";
/**
 * Neumorphic Skin Card  v1.0
 * ──────────────────────────
 * A wrapper that takes ANY Lovelace card config and applies the neumorphic
 * aesthetic to it: a soft raised/sunken/flat surface, and injected CSS
 * variables so theme-respecting cards adopt the palette, fonts, and shadows.
 *
 * ── What it can and can't do ────────────────────────────────────────────────
 * HA cards render inside their own shadow DOM, which outside CSS cannot pierce.
 * So this wrapper works on two levels that DON'T require breaking encapsulation:
 *   1. Frame — wraps the child in a neumorphic surface (always works).
 *   2. Variable injection — sets --ha-card-*, --primary-*, etc. on the child;
 *      cards that read theme variables (most built-ins) adopt them. Cards that
 *      hardcode their own styles keep their internals (by design).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  type: custom:neumorphic-skin-card                            │
 * │  card:                          # a single child card…        │
 * │    type: entities                                             │
 * │    entities: [sun.sun]                                        │
 * │  # …or several:                                               │
 * │  cards:                                                       │
 * │    - { type: button, entity: light.x }                       │
 * │    - { type: gauge, entity: sensor.y }                        │
 * │  style: raised          # raised | sunken | flat              │
 * │  surface: "#E7E5E4"                                           │
 * │  radius: 20                                                   │
 * │  depth: 1               # shadow strength multiplier          │
 * │  gap: 14                # spacing between multiple children   │
 * │  inject_vars: true      # push neumorphic vars into children  │
 * └──────────────────────────────────────────────────────────────┘
 */
var _a;

const SK_LIGHT = {
    surface: "#E7E5E4", shadowDark: "#c5c3c2", shadowLight: "#ffffff",
    text: "#1E2938", textSecondary: "#6b7280", accent: "#006666",
};
const SK_DARK = {
    surface: "#23272e", shadowDark: "#181a1f", shadowLight: "#2c3140",
    text: "#e6e8ec", textSecondary: "#9aa0aa", accent: "#00b3a4",
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

// Derive light/dark neumorphic shadow companions from a surface hex.
function deriveShadows(hex) {
    let h = String(hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    const dark = `rgb(${Math.round(r * 0.86)},${Math.round(g * 0.86)},${Math.round(b * 0.86)})`;
    const light = `rgb(${Math.min(255, Math.round(r * 1.12))},${Math.min(255, Math.round(g * 1.12))},${Math.min(255, Math.round(b * 1.12))})`;
    return { dark, light };
}

class NeumorphicSkinCard extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._config = null;
        this._isDark = true;
        this._built = false;
        this._children = [];       // { el, config }
        this._helpers = null;
        this._themeObserver = null;
        this._loading = false;
    }

    setConfig(config) {
        const list = [];
        if (Array.isArray(config.cards)) config.cards.forEach((c) => list.push(c));
        else if (config.card) list.push(config.card);
        if (!list.length) throw new Error("neumorphic-skin-card: provide 'card:' (one) or 'cards:' (several)");
        this._config = Object.assign({
            style: "raised",       // raised | sunken | flat
            radius: 20,
            depth: 1,
            padding: 16,
            gap: 14,
            inject_vars: true,
            match_child_padding: false,
        }, config);
        this._childConfigs = list;
        // Config changed → children must be rebuilt.
        this._children = [];
        if (this.shadowRoot) { this._ensureChildren(); this._updateStyle(); this._render(); }
    }

    set hass(hass) {
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        if (!this._built) { this._build(); this._watchTheme(); }
        // Re-pass hass to every child on every update (required by HA cards).
        this._children.forEach((c) => { if (c.el) c.el.hass = hass; });
        if (this.shadowRoot) { this._ensureChildren(); this._updateStyle(); }
    }

    getCardSize() {
        // Sum child sizes if known, else a sensible default.
        let total = 0;
        this._children.forEach((c) => { total += (c.el && typeof c.el.getCardSize === "function") ? (Number(c.el.getCardSize()) || 2) : 3; });
        return total || 3;
    }
    static getStubConfig() { return { card: { type: "entities", entities: [] }, style: "raised" }; }
    static getConfigElement() { return document.createElement("neumorphic-skin-editor"); }

    _build() {
        if (this.shadowRoot) return;
        this._built = true;
        const shadow = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.id = "neu-style";
        const root = document.createElement("div");
        root.id = "skin-root";
        shadow.appendChild(style);
        shadow.appendChild(root);
        this._updateStyle(style);
        this._ensureChildren();
    }

    // Create child card elements via HA's card helpers (async, once).
    async _ensureChildren() {
        if (!this.shadowRoot) return;
        const root = this.shadowRoot.getElementById("skin-root");
        if (!root) return;
        // Already built for the current configs?
        if (this._children.length === this._childConfigs.length && this._children.every((c) => c.el)) {
            this._render();
            return;
        }
        if (this._loading) return;
        this._loading = true;
        try {
            if (!this._helpers && window.loadCardHelpers) this._helpers = await window.loadCardHelpers();
        } catch (_a) { /* ignore */ }
        this._children = this._childConfigs.map((cfg) => {
            let el;
            try {
                if (this._helpers && this._helpers.createCardElement) el = this._helpers.createCardElement(cfg);
                else { el = document.createElement("hui-error-card"); el.setConfig && el.setConfig({ type: "error", error: "Card helpers unavailable", origConfig: cfg }); }
            } catch (e) {
                el = document.createElement("div");
                el.textContent = `Bad card config: ${e && e.message ? e.message : e}`;
                el.style.cssText = "padding:12px;color:#c0392b;font-family:monospace;font-size:12px;";
            }
            if (el && this._hass) el.hass = this._hass;
            return { el, config: cfg };
        });
        this._loading = false;
        this._render();
    }

    _render() {
        if (!this.shadowRoot) return;
        const root = this.shadowRoot.getElementById("skin-root");
        if (!root) return;
        const multi = this._children.length > 1;
        // (Re)mount children into skin cells.
        root.textContent = "";
        this._children.forEach((c) => {
            const cell = document.createElement("div");
            cell.className = "skin-cell";
            if (c.el) {
                this._applyChildVars(c.el);
                cell.appendChild(c.el);
            }
            root.appendChild(cell);
        });
        root.className = multi ? "multi" : "single";
    }

    // Inject neumorphic CSS variables onto the child host so theme-aware cards
    // adopt the palette/fonts, and suppress the child's own card frame so it
    // doesn't double up with ours.
    _applyChildVars(el) {
        if (!el || !el.style) return;
        if (this._config.inject_vars === false) {
            // Still neutralise the child frame so our surface shows through.
            el.style.setProperty("--ha-card-box-shadow", "none");
            el.style.setProperty("--ha-card-background", "transparent");
            el.style.setProperty("--ha-card-border-width", "0");
            return;
        }
        const p = this._isDark ? SK_DARK : SK_LIGHT;
        const surface = this._config.surface || p.surface;
        const text = this._config.text_color || p.text;
        const textSec = this._config.text_secondary || p.textSecondary;
        const accent = this._config.accent_color || p.accent;
        const font = this._config.font || "'Space Mono', monospace";
        const setV = (k, v) => el.style.setProperty(k, v);
        // The child sits ON our surface, so its own card chrome is removed.
        setV("--ha-card-background", "transparent");
        setV("--card-background-color", "transparent");
        setV("--ha-card-box-shadow", "none");
        setV("--ha-card-border-width", "0");
        setV("--ha-card-border-color", "transparent");
        // Palette
        setV("--primary-text-color", text);
        setV("--secondary-text-color", textSec);
        setV("--primary-color", accent);
        setV("--accent-color", accent);
        setV("--state-icon-color", text);
        setV("--paper-item-icon-color", text);
        setV("--primary-font-family", font);
        setV("--paper-font-common-base_-_font-family", font);
        // Some cards use these for inner surfaces (sliders, chips) — tint to surface.
        setV("--secondary-background-color", surface);
        setV("--divider-color", this._isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)");
    }

    _updateStyle(styleEl) {
        var _a;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el) return;
        const p = this._isDark ? SK_DARK : SK_LIGHT;
        const cfg = this._config || {};
        const surface = cfg.surface || p.surface;
        const derived = deriveShadows(surface);
        const sd = cfg.shadow_dark || (derived ? derived.dark : p.shadowDark);
        const sl = cfg.shadow_light || (derived ? derived.light : p.shadowLight);
        const depth = clamp(Number(cfg.depth) || 1, 0, 3);
        const radius = clamp(Number(cfg.radius) || 20, 0, 60);
        const pad = clamp(Number(cfg.padding) || 16, 0, 60);
        const gap = clamp(Number(cfg.gap) || 14, 0, 60);
        const d1 = Math.round(7 * depth), d2 = Math.round(14 * depth);
        const din = Math.round(4 * depth), din2 = Math.round(9 * depth);

        let boxShadow;
        if (cfg.style === "flat") boxShadow = "none";
        else if (cfg.style === "sunken") boxShadow = `inset ${din}px ${din}px ${din2}px ${sd}, inset -${din}px -${din}px ${din2}px ${sl}`;
        else boxShadow = `${d1}px ${d1}px ${d2}px ${sd}, -${d1}px -${d1}px ${d2}px ${sl}`;

        el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
      :host { display:block; }
      #skin-root {
        background:${surface};
        border-radius:${radius}px;
        box-shadow:${boxShadow};
        padding:${pad}px;
        box-sizing:border-box;
        font-family:${cfg.font || "var(--primary-font-family,'Space Mono',monospace)"};
        color:${cfg.text_color || p.text};
        transition:box-shadow .2s ease;
      }
      #skin-root.multi { display:flex; flex-direction:column; gap:${gap}px; }
      .skin-cell { min-width:0; }
      /* Let the child fill the cell; strip its own outer margins. */
      .skin-cell > * { display:block; width:100%; margin:0; }
      /* Best-effort: many cards expose an inner ha-card that reads these vars. */
      .skin-cell ha-card { box-shadow:none !important; background:transparent !important; border:0 !important; }
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
    disconnectedCallback() { var _a; (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect(); }
}

// ── Editor ────────────────────────────────────────────────────────────────────
const SKIN_EDITOR_CSS = `
  :host { display:block; font-family:var(--paper-font-body1_-_font-family,sans-serif); }
  .sec-hdr { display:flex; align-items:center; gap:8px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--secondary-text-color,#8891a0); padding:14px 0 6px; border-bottom:1px solid var(--divider-color,rgba(0,0,0,.08)); margin-bottom:10px; }
  label { display:block; font-size:12px; color:var(--secondary-text-color,#6b7280); margin-bottom:3px; font-weight:500; }
  input[type=text],input[type=number],select,textarea { width:100%; padding:8px 10px; border-radius:6px; border:1px solid var(--divider-color,#d1d5db); background:var(--card-background-color,#fff); color:var(--primary-text-color,#111); font-size:13px; box-sizing:border-box; font-family:inherit; }
  textarea { min-height:120px; font-family:monospace; font-size:12px; white-space:pre; }
  input:focus,select:focus,textarea:focus { outline:none; border-color:var(--primary-color,#006666); }
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
  .color-swatch input[type=color] { position:absolute; inset:-4px; width:calc(100% + 8px); height:calc(100% + 8px); opacity:0; cursor:pointer; }
  .color-field input[type=text] { flex:1; font-family:monospace; font-size:12px; text-transform:uppercase; }
  .hint { font-size:11px; color:var(--secondary-text-color,#8891a0); margin:2px 0 8px; line-height:1.4; }
  .err { color:#c0392b; font-size:11px; margin-top:4px; min-height:14px; }
`;

class NeumorphicSkinCardEditor extends HTMLElement {
    constructor() { super(); this._hass = null; this._config = {}; this._built = false; }
    set hass(h) { this._hass = h; }
    setConfig(config) { this._config = Object.assign({}, config); if (!this._built) { this.attachShadow({ mode: "open" }); this._built = true; } this._render(); }
    _get(path, fb = "") { const v = path.split(".").reduce((o, k) => (o != null && typeof o === "object") ? o[k] : undefined, this._config); return v !== undefined && v !== null ? v : fb; }
    _write(path, value) { const parts = path.split("."); let cur = this._config; for (let i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {}; cur = cur[parts[i]]; } if (value === "" || value === undefined || value === null) delete cur[parts[parts.length - 1]]; else cur[parts[parts.length - 1]] = value; }
    _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: Object.assign({}, this._config) }, bubbles: true, composed: true })); }
    _set(path, value) { this._write(path, value); this._fire(); this._render(); }
    _setQuiet(path, value) { this._write(path, value); this._fire(); }
    _range(path, lbl, min, max, step, suffix = "", def = min) { const v = Number(this._get(path, def)); return `<div class="field"><label>${lbl}</label><div class="range-wrap"><input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}"><span class="range-val" data-rv="${path}">${v}${suffix}</span></div></div>`; }
    _select(path, lbl, opts) { const cur = String(this._get(path, opts[0].value)); return `<div class="field"><label>${lbl}</label><select data-path="${path}">${opts.map((o) => `<option value="${o.value}"${cur === o.value ? " selected" : ""}>${o.label}</option>`).join("")}</select></div>`; }
    _toggle(path, lbl, def = false) { return `<div class="tog-row"><label>${lbl}</label><label class="switch"><input type="checkbox" data-path="${path}"${Boolean(this._get(path, def)) ? " checked" : ""}><span class="sw-track"></span></label></div>`; }
    _color(path, lbl, def) { let raw = String(this._get(path, "") || def); if (!/^#[0-9a-fA-F]{6}$/i.test(raw)) raw = def; return `<div class="field"><label>${lbl}</label><div class="color-field" data-colorpath="${path}"><div class="color-swatch" style="background:${raw}"><input type="color" value="${raw}"></div><input type="text" class="color-hex" value="${raw.toUpperCase()}" placeholder="#RRGGBB" maxlength="7"></div></div>`; }
    _yamlOf(obj) {
        // Minimal YAML-ish serialiser for the child card config in the textarea.
        try { return this._toYaml(obj, 0); } catch (_a) { return ""; }
    }
    _toYaml(o, indent) {
        const pad = "  ".repeat(indent);
        if (Array.isArray(o)) return o.map((v) => (typeof v === "object" && v !== null) ? `${pad}-\n${this._toYaml(v, indent + 1)}` : `${pad}- ${this._scalar(v)}`).join("\n");
        if (o && typeof o === "object") return Object.keys(o).map((k) => { const v = o[k]; if (v && typeof v === "object") return `${pad}${k}:\n${this._toYaml(v, indent + 1)}`; return `${pad}${k}: ${this._scalar(v)}`; }).join("\n");
        return `${pad}${this._scalar(o)}`;
    }
    _scalar(v) { if (v === null || v === undefined) return ""; if (typeof v === "string" && /[:#{}\[\],&*?|<>=!%@`"]/.test(v)) return JSON.stringify(v); return String(v); }
    _render() {
        const sr = this.shadowRoot;
        const isMulti = Array.isArray(this._config.cards);
        const childYaml = isMulti ? this._yamlOf(this._config.cards) : this._yamlOf(this._config.card || {});
        const html = `
      <div class="sec-hdr">🎴 Child Card</div>
      <div class="hint">Paste any Lovelace card config here (YAML). Use a list for multiple cards.</div>
      ${this._toggle("__multi__", "Multiple cards (cards:)", isMulti)}
      <div class="field"><label>${isMulti ? "cards:" : "card:"} config</label>
        <textarea data-childyaml placeholder="type: entities&#10;entities:&#10;  - sun.sun">${String(childYaml).replace(/</g, "&lt;")}</textarea>
        <div class="err" data-yamlerr></div>
      </div>

      <div class="sec-hdr">🎨 Neumorphic Frame</div>
      ${this._select("style", "Style", [{ value: "raised", label: "Raised" }, { value: "sunken", label: "Sunken" }, { value: "flat", label: "Flat" }])}
      ${this._range("radius", "Corner radius", 0, 60, 1, "px", 20)}
      ${this._range("depth", "Shadow depth", 0, 3, 0.1, "×", 1)}
      ${this._range("padding", "Padding", 0, 60, 1, "px", 16)}
      ${this._range("gap", "Gap (multiple cards)", 0, 60, 1, "px", 14)}

      <div class="sec-hdr">🌈 Tokens (injected into children)</div>
      ${this._toggle("inject_vars", "Inject neumorphic variables into children", true)}
      <div class="hint">Cards that read theme variables adopt these. Cards that hardcode their styles keep their internals.</div>
      ${this._color("surface", "Surface", "#E7E5E4")}
      ${this._color("accent_color", "Accent", "#006666")}
      ${this._color("text_color", "Text", "#1E2938")}
      ${this._color("text_secondary", "Secondary text", "#6b7280")}
      <div class="field"><label>Font family</label><input type="text" data-path="font" value="${String(this._get("font", "")).replace(/"/g, "&quot;")}" placeholder="'Space Mono', monospace"></div>
    `;
        const style = document.createElement("style"); style.textContent = SKIN_EDITOR_CSS;
        const div = document.createElement("div"); div.innerHTML = html;

        // Child YAML textarea
        const ta = div.querySelector("textarea[data-childyaml]");
        const errEl = div.querySelector("[data-yamlerr]");
        if (ta) ta.addEventListener("change", () => {
            const parsed = this._parseYaml(ta.value);
            if (parsed.error) { errEl.textContent = parsed.error; return; }
            errEl.textContent = "";
            if (Array.isArray(this._config.cards)) { this._config.cards = Array.isArray(parsed.value) ? parsed.value : [parsed.value]; }
            else { this._config.card = Array.isArray(parsed.value) ? parsed.value[0] : parsed.value; }
            this._fire();
        });

        // Multi toggle converts card <-> cards
        const multiCb = div.querySelector('input[data-path="__multi__"]');
        if (multiCb) multiCb.addEventListener("change", () => {
            if (multiCb.checked) { const one = this._config.card || {}; delete this._config.card; this._config.cards = Array.isArray(one) ? one : [one]; }
            else { const arr = this._config.cards || []; delete this._config.cards; this._config.card = arr[0] || {}; }
            this._set("__noop__", undefined); // triggers fire + re-render
        });

        this._wire(div);
        sr.innerHTML = ""; sr.appendChild(style); sr.appendChild(div);
    }
    _wire(div) {
        div.querySelectorAll('input[type=text][data-path]:not(.color-hex)').forEach((el) => {
            el.addEventListener("input", () => this._setQuiet(el.dataset.path, el.value === "" ? undefined : el.value));
            el.addEventListener("change", () => this._setQuiet(el.dataset.path, el.value === "" ? undefined : el.value));
        });
        div.querySelectorAll("select[data-path]").forEach((sel) => sel.addEventListener("change", () => this._set(sel.dataset.path, sel.value)));
        div.querySelectorAll("input[type=checkbox][data-path]:not([data-path='__multi__'])").forEach((el) => el.addEventListener("change", () => this._set(el.dataset.path, el.checked)));
        div.querySelectorAll("input[type=range][data-path]").forEach((el) => {
            el.addEventListener("input", () => { const rv = div.querySelector(`[data-rv="${el.dataset.path}"]`); if (rv) rv.textContent = el.value + (el.dataset.suffix || ""); });
            el.addEventListener("change", () => this._set(el.dataset.path, Number(el.value)));
        });
        div.querySelectorAll(".color-field[data-colorpath]").forEach((field) => {
            const path = field.dataset.colorpath; const native = field.querySelector("input[type=color]"); const swatch = field.querySelector(".color-swatch"); const text = field.querySelector("input.color-hex");
            native.addEventListener("input", () => { swatch.style.background = native.value; text.value = native.value.toUpperCase(); });
            native.addEventListener("change", () => this._set(path, native.value));
            text.addEventListener("change", () => { let v = text.value.trim(); if (!v.startsWith("#")) v = "#" + v; if (/^#[0-9a-fA-F]{6}$/i.test(v)) { swatch.style.background = v; native.value = v; this._set(path, v); } });
        });
    }
    // Tiny YAML parser (indentation-based, supports maps/lists/scalars) — enough
    // for card configs pasted in the editor. Falls back to JSON if it looks like JSON.
    _parseYaml(text) {
        const trimmed = (text || "").trim();
        if (!trimmed) return { value: {} };
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) { try { return { value: JSON.parse(trimmed) }; } catch (e) { return { error: "Invalid JSON: " + e.message }; } }
        try { return { value: this._yamlParse(trimmed.split(/\r?\n/)) }; }
        catch (e) { return { error: e.message || "Invalid YAML" }; }
    }
    _yamlParse(lines) {
        let idx = 0;
        const peekIndent = (l) => l.match(/^ */)[0].length;
        const parseBlock = (indent) => {
            // Determine list vs map by first non-empty line at this indent.
            let result = null;
            while (idx < lines.length) {
                let line = lines[idx];
                if (!line.trim() || line.trim().startsWith("#")) { idx++; continue; }
                const ind = peekIndent(line);
                if (ind < indent) break;
                if (ind > indent) throw new Error("Unexpected indentation");
                const content = line.slice(ind);
                if (content.startsWith("- ") || content === "-") {
                    if (result === null) result = [];
                    idx++;
                    const rest = content === "-" ? "" : content.slice(2);
                    if (rest === "") { result.push(parseBlock(indent + 2)); }
                    else if (/^[\w"'-]+\s*:/.test(rest)) {
                        // inline "- key: val" starts a map at this deeper column
                        lines[idx - 1] = " ".repeat(indent + 2) + rest;
                        idx--; result.push(parseBlock(indent + 2));
                    } else { result.push(this._yamlScalar(rest)); }
                } else {
                    const m = content.match(/^([^:]+):\s*(.*)$/);
                    if (!m) throw new Error("Expected 'key: value'");
                    if (result === null) result = {};
                    const key = m[1].trim(); const val = m[2];
                    idx++;
                    if (val === "" ) { result[key] = parseBlock(indent + 2); }
                    else if (val === "|" || val === ">") { result[key] = val; }
                    else result[key] = this._yamlScalar(val);
                }
            }
            return result === null ? {} : result;
        };
        return parseBlock(0);
    }
    _yamlScalar(s) {
        s = s.trim();
        if (s === "") return "";
        if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) { try { return JSON.parse(s.replace(/^'|'$/g, '"')); } catch (_a) { return s.slice(1, -1); } }
        if (s.startsWith("[") || s.startsWith("{")) { try { return JSON.parse(s); } catch (_a) { /* leave as string */ } }
        if (s === "true") return true; if (s === "false") return false; if (s === "null" || s === "~") return null;
        if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
        return s;
    }
}

customElements.define("neumorphic-skin-editor", NeumorphicSkinCardEditor);
customElements.define("neumorphic-skin-card", NeumorphicSkinCard);
window.customCards = (_a = window.customCards) !== null && _a !== void 0 ? _a : [];
window.customCards.push({
    type: "neumorphic-skin-card",
    name: "Neumorphic Skin",
    description: "Wrap any Lovelace card in a neumorphic surface and inject the theme tokens — Neumorphic theme",
    preview: true,
});
