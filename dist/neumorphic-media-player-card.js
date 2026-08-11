"use strict";
/**
 * Neumorphic Media Player Card  v1.0
 * ──────────────────────────────────
 * A soft-UI now-playing card for Home Assistant media_player entities.
 * Design-system aligned (surface #E7E5E4, text #1E2938, accent #006666, Space Mono).
 *
 * Layout: header (back / "Playing" / menu) · circular album art in a raised disc ·
 * title + artist · progress bar with elapsed/total · prev / play-pause / next ·
 * shuffle + repeat + queue. Buttons appear only when supported_features allows.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  type: custom:neumorphic-media-player-card                    │
 * │  entity: media_player.living_room     # required              │
 * │  name: "Playing"            # header centre label             │
 * │  card_size: 340             # base width px, 260–460           │
 * │  accent_color: "#006666"    # progress fill + play icon       │
 * │  art_shape: circle          # circle | squircle | square      │
 * │  show_header: true          # back / label / menu row         │
 * │  show_progress: true        # progress bar + times            │
 * │  show_volume: false         # volume row (slider + mute)       │
 * │  show_shuffle_repeat: true  # bottom shuffle/repeat/queue row  │
 * │  show_source: false         # source dropdown                 │
 * │  display_only: false        # hide all controls (art+info)    │
 * └──────────────────────────────────────────────────────────────┘
 */
var _a;

// ── Feature bitmask ──────────────────────────────────────────────────────────
const MF = {
    PAUSE: 1, SEEK: 2, VOLUME_SET: 4, VOLUME_MUTE: 8, PREVIOUS_TRACK: 16, NEXT_TRACK: 32,
    TURN_ON: 128, TURN_OFF: 256, PLAY_MEDIA: 512, VOLUME_STEP: 1024, SELECT_SOURCE: 2048,
    STOP: 4096, CLEAR_PLAYLIST: 8192, PLAY: 16384, SHUFFLE_SET: 32768,
    SELECT_SOUND_MODE: 65536, REPEAT_SET: 262144, GROUPING: 524288,
};

// ── Palettes (design-system tokens) ──────────────────────────────────────────
const M_LIGHT = {
    bg: "#E7E5E4", surface: "#E7E5E4",
    shadowDark: "#c5c3c2", shadowLight: "#ffffff",
    textPrimary: "#1E2938", textSecondary: "#6b7280", textFaint: "#a8a5a3",
    track: "#d8d6d5",
};
const M_DARK = {
    bg: "#23272e", surface: "#23272e",
    shadowDark: "#181a1f", shadowLight: "#2c3140",
    textPrimary: "#e6e8ec", textSecondary: "#9aa0aa", textFaint: "#5a606c",
    track: "#1c1f25",
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

// ── Typography helpers (shared suite pattern) ────────────────────────────────
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

// ── i18n (runtime strings; auto-detected from hass.language, fallback en) ─────
const MP_I18N = {
    en: { Playing: "Playing", Paused: "Paused", Buffering: "Buffering", Idle: "Idle", Off: "Off", unavailable: "unavailable", play_on: "Play on", no_group: "No other groupable players" },
    it: { Playing: "In riproduzione", Paused: "In pausa", Buffering: "Buffering", Idle: "Inattivo", Off: "Spento", unavailable: "non disponibile", play_on: "Riproduci su", no_group: "Nessun altro lettore raggruppabile" },
    es: { Playing: "Reproduciendo", Paused: "En pausa", Buffering: "Cargando", Idle: "Inactivo", Off: "Apagado", unavailable: "no disponible", play_on: "Reproducir en", no_group: "No hay otros reproductores agrupables" },
    fr: { Playing: "Lecture", Paused: "En pause", Buffering: "Mise en mémoire", Idle: "Inactif", Off: "Éteint", unavailable: "indisponible", play_on: "Lire sur", no_group: "Aucun autre lecteur groupable" },
    de: { Playing: "Wiedergabe", Paused: "Pausiert", Buffering: "Puffern", Idle: "Inaktiv", Off: "Aus", unavailable: "nicht verfügbar", play_on: "Abspielen auf", no_group: "Keine weiteren gruppierbaren Player" },
};
function mpLang(hass) {
    const l = (hass && (hass.language || (hass.locale && hass.locale.language))) || "en";
    const base = String(l).toLowerCase().split("-")[0];
    return MP_I18N[base] ? base : "en";
}

function fmtTime(sec) {
    if (sec == null || isNaN(sec) || sec < 0) return "0:00";
    sec = Math.floor(sec);
    const m = Math.floor(sec / 60), s = sec % 60;
    if (m >= 60) {
        const h = Math.floor(m / 60), mm = m % 60;
        return `${h}:${String(mm).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
}

class NeumorphicMediaPlayerCard extends HTMLElement {
    constructor() {
        super();
        this._hass = null;
        this._config = null;
        this._rawConfig = null;
        this._isDark = true;
        this._hassReady = false;
        this._themeObserver = null;
        this._tick = null;            // 1s progress updater
        this._seekPending = null;     // optimistic seek value
    }

    setConfig(config) {
        if (!config.entity && !(Array.isArray(config.entities) && config.entities.length))
            throw new Error("neumorphic-media-player-card: 'entity' (or 'entities') is required");
        this._rawConfig = config;
        // Normalise the player list. Accept `entities:` (list) and/or single `entity`.
        const list = [];
        if (Array.isArray(config.entities)) {
            for (const e of config.entities) {
                if (typeof e === "string") list.push({ entity: e });
                else if (e && e.entity) list.push({ entity: e.entity, name: e.name, icon: e.icon });
            }
        }
        if (config.entity && !list.find((x) => x.entity === config.entity)) list.unshift({ entity: config.entity });
        this._players = list;
        this._config = Object.assign({
            name: "Playing",
            card_size: 340,
            accent_color: "#006666",
            art_shape: "circle",
            spin_art: true,
            spin_speed: 12,
            show_header: true,
            show_progress: true,
            show_volume: false,
            show_shuffle_repeat: true,
            show_source: false,
            show_player_switcher: true,
            show_grouping: true,
            display_only: false,
        }, config, { entity: (list[0] && list[0].entity) || config.entity });
        // Preserve the active selection across config edits if still valid.
        if (!this._activeEntity || !list.find((x) => x.entity === this._activeEntity)) {
            this._activeEntity = this._config.entity;
        }
        this._groupingOpen = false;
        if (this.shadowRoot) { this._updateStyle(); this._render(); }
    }

    set hass(hass) {
        this._hass = hass;
        this._isDark = resolveIsDark(hass);
        if (!this._hassReady) {
            this._hassReady = true;
            this._build();
            this._watchTheme();
            this._startTick();
        }
        // Clear the optimistic overlay once the real state confirms it (server wins
        // after the round-trip completes).
        if (this._optimistic) {
            const raw = this._rawStateObj;
            if (raw) {
                const o = this._optimistic;
                const matches =
                    (o.state === undefined || raw.state === o.state) &&
                    (o.is_volume_muted === undefined || !!raw.attributes.is_volume_muted === o.is_volume_muted) &&
                    (o.shuffle === undefined || !!raw.attributes.shuffle === o.shuffle) &&
                    (o.repeat === undefined || (raw.attributes.repeat || "off") === o.repeat);
                if (matches) { this._optimistic = null; if (this._optTimer) { clearTimeout(this._optTimer); this._optTimer = null; } }
            }
        }
        if (this.shadowRoot) { this._updateStyle(); this._render(); }
    }

    getCardSize() { return 6; }

    static getStubConfig(hass) {
        let ent = "media_player.living_room";
        if (hass && hass.states) {
            const first = Object.keys(hass.states).find((e) => e.startsWith("media_player."));
            if (first) ent = first;
        }
        return { entity: ent };
    }
    static getConfigElement() { return document.createElement("neumorphic-media-player-editor"); }

    get KS() { var _a, _b; return clamp((_b = (_a = this._config) === null || _a === void 0 ? void 0 : _a.card_size) !== null && _b !== void 0 ? _b : 340, 260, 460); }
    get SCALE() { return this.KS / 340; }

    get _stateObj() {
        var _a, _b;
        const ent = this._activeEntity || ((_a = this._config) === null || _a === void 0 ? void 0 : _a.entity);
        const raw = ent && ((_b = this._hass) === null || _b === void 0 ? void 0 : _b.states) ? this._hass.states[ent] : null;
        if (!raw) return null;
        // Overlay optimistic values (from a just-tapped control) so the UI reflects
        // the expected result instantly, before the server round-trip completes.
        if (this._optimistic) {
            const o = this._optimistic;
            return Object.assign({}, raw, {
                state: o.state !== undefined ? o.state : raw.state,
                attributes: Object.assign({}, raw.attributes,
                    o.is_volume_muted !== undefined ? { is_volume_muted: o.is_volume_muted } : {},
                    o.shuffle !== undefined ? { shuffle: o.shuffle } : {},
                    o.repeat !== undefined ? { repeat: o.repeat } : {}),
            });
        }
        return raw;
    }
    get _rawStateObj() {
        var _a, _b;
        const ent = this._activeEntity || ((_a = this._config) === null || _a === void 0 ? void 0 : _a.entity);
        return ent && ((_b = this._hass) === null || _b === void 0 ? void 0 : _b.states) ? this._hass.states[ent] : null;
    }
    _supports(bit) {
        const s = this._stateObj;
        return s ? (Number(s.attributes.supported_features || 0) & bit) === bit : false;
    }

    // ── Live position (media_position advances from media_position_updated_at) ──
    get _position() {
        const s = this._stateObj;
        if (!s) return 0;
        if (this._seekPending !== null) return this._seekPending;
        const base = Number(s.attributes.media_position || 0);
        const updated = s.attributes.media_position_updated_at;
        if (s.state === "playing" && updated) {
            const elapsed = (Date.now() - new Date(updated).getTime()) / 1000;
            return base + Math.max(0, elapsed);
        }
        return base;
    }
    get _duration() { const s = this._stateObj; return s ? Number(s.attributes.media_duration || 0) : 0; }

    _startTick() {
        if (this._tick) return;
        this._tick = setInterval(() => {
            const s = this._stateObj;
            if (s && s.state === "playing" && this._config && this._config.show_progress) this._renderProgress();
        }, 1000);
    }
    disconnectedCallback() {
        var _a;
        (_a = this._themeObserver) === null || _a === void 0 ? void 0 : _a.disconnect();
        if (this._tick) { clearInterval(this._tick); this._tick = null; }
        if (this._optTimer) { clearTimeout(this._optTimer); this._optTimer = null; }
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
      <div class="mp-header" id="mp-header">
        <button class="hbtn" id="mp-back" aria-label="Back">${this._chevron()}</button>
        <div class="hlabel" id="mp-label"></div>
        <div class="hright">
          <button class="hbtn" id="mp-group" aria-label="Speaker groups">${this._castIcon()}</button>
          <button class="hbtn" id="mp-menu" aria-label="More">${this._dots()}</button>
        </div>
      </div>
      <div class="switcher" id="mp-switcher"></div>
      <div class="group-panel" id="mp-group-panel"></div>
      <div class="art-wrap" id="mp-art"></div>
      <div class="meta">
        <div class="title" id="mp-title"></div>
        <div class="artist" id="mp-artist"></div>
      </div>
      <div class="progress" id="mp-progress"></div>
      <div class="volume" id="mp-volume"></div>
      <div class="transport" id="mp-transport"></div>
      <div class="extras" id="mp-extras"></div>
      <div class="source" id="mp-source"></div>`;
        shadow.appendChild(style);
        shadow.appendChild(card);
        this._updateStyle(style);

        card.querySelector("#mp-back").addEventListener("click", () => this._moreInfo());
        card.querySelector("#mp-menu").addEventListener("click", () => this._moreInfo());
        // #mp-group is handled through delegation (see _onDelegatedClick).

        // Event delegation on the STABLE root. The rows below (transport, volume,
        // extras, source, switcher, seek bar) are rebuilt on every hass update,
        // so listeners bound inside their render methods would be lost — and a
        // re-render landing between press and click would swallow the tap. One
        // handler on the persistent root fixes that.
        card.addEventListener("click", (e) => this._onDelegatedClick(e));
        card.addEventListener("change", (e) => this._onDelegatedChange(e));
    }

    // IDs the delegated click handler actually acts on. Restricting to these
    // avoids stopping the search early on an unrelated ancestor that merely has
    // an id (e.g. a wrapper div), which previously swallowed the event.
    static get _CLICK_IDS() { return ["mp-play", "mp-prev", "mp-next", "mp-mute", "mp-shuffle", "mp-repeat", "mp-poweron", "mp-bar", "mp-vbar", "mp-group"]; }

    // Resolve the actionable element from an event. Prefer composedPath() (which
    // correctly crosses shadow boundaries and lists every node under the
    // pointer); fall back to a manual parent walk. Match either an element with
    // data-mpaction, or one whose id is in the handled set.
    _closestAction(e) {
        const handled = NeumorphicMediaPlayerCard._CLICK_IDS;
        const path = (e && typeof e.composedPath === "function") ? e.composedPath() : null;
        if (path && path.length) {
            for (const node of path) {
                if (!node || node === this.shadowRoot) break;
                if (node.dataset && node.dataset.mpaction) return node;
                if (node.id && handled.indexOf(node.id) !== -1) return node;
            }
            return null;
        }
        let el = e && e.target;
        const root = this.shadowRoot;
        while (el && el !== root) {
            if (el.dataset && el.dataset.mpaction) return el;
            if (el.id && handled.indexOf(el.id) !== -1) return el;
            el = el.parentNode || (el.getRootNode && el.getRootNode().host);
        }
        return null;
    }

    _onDelegatedClick(e) {
        const el = this._closestAction(e);
        if (!el) return;
        const s = this._stateObj;
        const id = el.id;
        const act = el.dataset ? el.dataset.mpaction : null;

        // Player switcher chip
        if (act === "switch") {
            const ent = el.dataset.ent;
            if (ent && ent !== this._activeEntity) {
                this._activeEntity = ent; this._groupingOpen = false; this._seekPending = null;
                this._updateStyle(); this._render();
            }
            return;
        }
        // Grouping row
        if (act === "grouprow") {
            const ent = el.dataset.ent;
            const joined = (s && (s.attributes.group_members || []).includes(ent));
            const master = this._activeEntity;
            if (joined) this._hass.callService("media_player", "unjoin", { entity_id: ent });
            else this._hass.callService("media_player", "join", { entity_id: master, group_members: [ent] });
            return;
        }
        // Seek bar
        if (id === "mp-bar") {
            if (this._config.display_only || !this._supports(MF.SEEK)) return;
            const rect = el.getBoundingClientRect();
            const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            const target = Math.round(frac * this._duration);
            this._seekPending = target; this._renderProgress();
            this._svc("media_seek", { seek_position: target });
            setTimeout(() => { this._seekPending = null; }, 1500);
            return;
        }
        // Volume bar
        if (id === "mp-vbar") {
            if (this._config.display_only) return;
            const rect = el.getBoundingClientRect();
            const frac = clamp((e.clientX - rect.left) / rect.width, 0, 1);
            this._svc("volume_set", { volume_level: Math.round(frac * 100) / 100 });
            return;
        }
        // Speaker-grouping panel toggle (UI only — allowed regardless of display_only).
        if (id === "mp-group") { this._groupingOpen = !this._groupingOpen; this._render(); return; }
        if (this._config.display_only) return;
        switch (id) {
            case "mp-play": {
                // Optimistic: flip the icon immediately, don't wait for the server.
                const nowPlaying = s && s.state === "playing";
                this._setOptimistic({ state: nowPlaying ? "paused" : "playing" });
                this._renderTransport();
                this._svc("media_play_pause");
                break;
            }
            case "mp-prev": if (this._supports(MF.PREVIOUS_TRACK)) this._svc("media_previous_track"); break;
            case "mp-next": if (this._supports(MF.NEXT_TRACK)) this._svc("media_next_track"); break;
            case "mp-mute": {
                const muted = s && !!s.attributes.is_volume_muted;
                this._setOptimistic({ is_volume_muted: !muted });
                this._renderVolume();
                this._svc("volume_mute", { is_volume_muted: !muted });
                break;
            }
            case "mp-shuffle": {
                const sh = s && !!s.attributes.shuffle;
                this._setOptimistic({ shuffle: !sh });
                this._renderExtras();
                this._svc("shuffle_set", { shuffle: !sh });
                break;
            }
            case "mp-repeat": {
                const r = (s && s.attributes.repeat) || "off";
                const nx = r === "off" ? "all" : r === "all" ? "one" : "off";
                this._setOptimistic({ repeat: nx });
                this._renderExtras();
                this._svc("repeat_set", { repeat: nx });
                break;
            }
            case "mp-poweron": if (this._supports(MF.TURN_ON)) this._svc("turn_on"); break;
        }
    }

    _onDelegatedChange(e) {
        const el = e.target;
        if (el && el.id === "mp-src") this._svc("select_source", { source: el.value });
    }

    _chevron() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`; }
    _dots() { return `<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>`; }
    _castIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 16a5 5 0 015 5"/><path d="M2 12a9 9 0 019 9"/><path d="M2 8a13 13 0 0113 13"/><rect x="2" y="3" width="20" height="16" rx="2"/></svg>`; }

    _updateStyle(styleEl) {
        var _a;
        const el = styleEl !== null && styleEl !== void 0 ? styleEl : (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.getElementById("neu-style");
        if (!el) return;
        // The stylesheet only depends on theme + config, NOT on entity state. Rewriting
        // it on every hass update would restart the CSS spin animation (stutter). Skip
        // the rewrite unless something style-relevant actually changed. `styleEl` is
        // passed explicitly on first build, which always writes.
        const styleSig = JSON.stringify([this._isDark, this._config]);
        if (!styleEl && this._styleSig === styleSig) return;
        this._styleSig = styleSig;
        const p = this._isDark ? M_DARK : M_LIGHT;
        const cfg = this._config || {};
        const sc = this.SCALE;
        const accent = cfg.accent_color || "#006666";
        const pad = Math.round(24 * sc);
        const artR = cfg.art_shape === "circle" ? "50%" : cfg.art_shape === "squircle" ? `${Math.round(38 * sc)}px` : `${Math.round(14 * sc)}px`;
        const softOut = `${Math.round(6 * sc)}px ${Math.round(6 * sc)}px ${Math.round(14 * sc)}px ${p.shadowDark}, -${Math.round(6 * sc)}px -${Math.round(6 * sc)}px ${Math.round(14 * sc)}px ${p.shadowLight}`;
        const softOutSm = `${Math.round(4 * sc)}px ${Math.round(4 * sc)}px ${Math.round(9 * sc)}px ${p.shadowDark}, -${Math.round(4 * sc)}px -${Math.round(4 * sc)}px ${Math.round(9 * sc)}px ${p.shadowLight}`;
        const softIn = `inset ${Math.round(3 * sc)}px ${Math.round(3 * sc)}px ${Math.round(7 * sc)}px ${p.shadowDark}, inset -${Math.round(3 * sc)}px -${Math.round(3 * sc)}px ${Math.round(7 * sc)}px ${p.shadowLight}`;

        el.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
      :host { display:block; }
      ha-card {
        display:flex; flex-direction:column; align-items:stretch;
        padding:${pad}px; box-sizing:border-box; width:100%;
        background:${cfg.no_border ? "transparent" : `var(--ha-card-background, var(--card-background-color, ${p.bg}))`};
        border-radius:${cfg.no_border ? "0" : "var(--ha-card-border-radius, 28px)"};
        box-shadow:${cfg.no_border ? "none" : `var(--ha-card-box-shadow, ${softOut})`};
        color:${p.textPrimary};
        font-family:var(--primary-font-family,'Space Mono',monospace);
      }
      .mp-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:${Math.round(18 * sc)}px; }
      .mp-header.hidden { display:none; }
      .hbtn {
        width:${Math.round(38 * sc)}px; height:${Math.round(38 * sc)}px; flex-shrink:0;
        display:flex; align-items:center; justify-content:center;
        border:none; border-radius:50%; background:${p.surface}; color:${p.textSecondary};
        box-shadow:${softOutSm}; cursor:pointer; -webkit-tap-highlight-color:transparent;
        transition:box-shadow .12s ease, color .12s ease, transform .05s ease;
      }
      .hbtn svg { width:${Math.round(18 * sc)}px; height:${Math.round(18 * sc)}px; pointer-events:none; }
      .hbtn:active { box-shadow:${softIn}; transform:translateY(0.5px); }
      .hlabel { font-size:${(12 * sc).toFixed(1)}px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:${p.textSecondary}; }
      .hright { display:flex; align-items:center; gap:${Math.round(8 * sc)}px; }

      .switcher { display:flex; flex-wrap:wrap; gap:${Math.round(8 * sc)}px; justify-content:center; margin-bottom:${Math.round(18 * sc)}px; }
      .switcher.hidden { display:none; }
      .chip-sw {
        display:inline-flex; align-items:center; gap:${Math.round(6 * sc)}px;
        font-family:var(--primary-font-family,'Space Mono',monospace);
        font-size:${(10.5 * sc).toFixed(1)}px; font-weight:600; color:${p.textSecondary};
        background:${p.surface}; border:none; border-radius:${Math.round(11 * sc)}px;
        padding:${Math.round(7 * sc)}px ${Math.round(11 * sc)}px; cursor:pointer;
        box-shadow:${softOutSm}; -webkit-tap-highlight-color:transparent;
        transition:box-shadow .12s ease, color .12s ease; max-width:${Math.round(120 * sc)}px;
      }
      .chip-sw svg { width:${Math.round(14 * sc)}px; height:${Math.round(14 * sc)}px; flex-shrink:0; }
      .chip-sw span { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .chip-sw span, .chip-sw svg, .chip-sw .live { pointer-events:none; }
      .group-row * { pointer-events:none; }
      .chip-sw.active { color:${accent}; box-shadow:${softIn}; }
      .chip-sw .live { width:${Math.round(6 * sc)}px; height:${Math.round(6 * sc)}px; border-radius:50%; background:${accent}; flex-shrink:0; }

      .group-panel { display:none; flex-direction:column; gap:${Math.round(6 * sc)}px; margin-bottom:${Math.round(18 * sc)}px; padding:${Math.round(12 * sc)}px; border-radius:${Math.round(14 * sc)}px; background:${p.surface}; box-shadow:${softIn}; }
      .group-panel.open { display:flex; }
      .group-title { font-size:${(9.5 * sc).toFixed(1)}px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:${p.textFaint}; margin-bottom:${Math.round(2 * sc)}px; }
      .group-row { display:flex; align-items:center; justify-content:space-between; padding:${Math.round(6 * sc)}px ${Math.round(4 * sc)}px; cursor:pointer; }
      .group-row .gname { font-size:${(12 * sc).toFixed(1)}px; color:${p.textPrimary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .group-row .gname.master { color:${accent}; font-weight:700; }
      .gcheck { width:${Math.round(20 * sc)}px; height:${Math.round(20 * sc)}px; border-radius:6px; flex-shrink:0; background:${p.surface}; box-shadow:${softOutSm}; display:flex; align-items:center; justify-content:center; }
      .gcheck.on { box-shadow:${softIn}; color:${accent}; }
      .gcheck svg { width:${Math.round(13 * sc)}px; height:${Math.round(13 * sc)}px; }

      .art-wrap { display:flex; align-items:center; justify-content:center; margin-bottom:${Math.round(24 * sc)}px; }
      .art-disc {
        width:${Math.round(210 * sc)}px; height:${Math.round(210 * sc)}px;
        border-radius:${cfg.art_shape === "circle" ? "50%" : artR};
        background:${p.surface}; box-shadow:${softOut};
        display:flex; align-items:center; justify-content:center;
        padding:${Math.round(14 * sc)}px; box-sizing:border-box;
      }
      .art-img {
        width:100%; height:100%; border-radius:${artR};
        background-size:cover; background-position:center;
        box-shadow:${softIn};
      }
      .art-img.placeholder { display:flex; align-items:center; justify-content:center; color:${p.textFaint}; }
      .art-img.placeholder svg { width:38%; height:38%; opacity:0.5; }
      .art-img.spin { animation:mp-spin ${clamp(Number(cfg.spin_speed) || 12, 2, 60)}s linear infinite; }
      @keyframes mp-spin { to { transform:rotate(360deg); } }

      .meta { text-align:center; margin-bottom:${Math.round(18 * sc)}px; }
      .title { font-size:${Math.round(21 * sc)}px; font-weight:700; color:${p.textPrimary}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .artist { font-size:${Math.round(13 * sc)}px; font-weight:400; color:${p.textSecondary}; margin-top:${Math.round(5 * sc)}px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

      .progress { margin-bottom:${Math.round(20 * sc)}px; }
      .progress.hidden { display:none; }
      .times { display:flex; justify-content:space-between; font-size:${(10.5 * sc).toFixed(1)}px; color:${p.textFaint}; margin-bottom:${Math.round(7 * sc)}px; }
      .bar {
        position:relative; height:${Math.round(8 * sc)}px; border-radius:${Math.round(4 * sc)}px;
        background:${p.surface}; box-shadow:${softIn};
        cursor:${cfg.display_only || !this._supports(MF.SEEK) ? "default" : "pointer"};
      }
      .bar-fill { position:absolute; top:0; left:0; height:100%; border-radius:${Math.round(4 * sc)}px; background:${accent}; min-width:${Math.round(8 * sc)}px; }
      .bar-knob { position:absolute; top:50%; width:${Math.round(13 * sc)}px; height:${Math.round(13 * sc)}px; border-radius:50%; background:${p.surface}; box-shadow:${softOutSm}; transform:translate(-50%,-50%); }

      .volume { display:flex; align-items:center; gap:${Math.round(12 * sc)}px; margin-bottom:${Math.round(18 * sc)}px; }
      .volume.hidden { display:none; }
      .vbtn { width:${Math.round(34 * sc)}px; height:${Math.round(34 * sc)}px; flex-shrink:0; display:flex; align-items:center; justify-content:center; border:none; border-radius:50%; background:${p.surface}; color:${p.textSecondary}; box-shadow:${softOutSm}; cursor:pointer; }
      .vbtn svg { width:${Math.round(17 * sc)}px; height:${Math.round(17 * sc)}px; pointer-events:none; }
      .vbtn.active { color:${accent}; box-shadow:${softIn}; }
      .vbar { position:relative; flex:1; height:${Math.round(7 * sc)}px; border-radius:${Math.round(4 * sc)}px; background:${p.surface}; box-shadow:${softIn}; cursor:${cfg.display_only ? "default" : "pointer"}; }
      .vbar-fill { position:absolute; top:0; left:0; height:100%; border-radius:${Math.round(4 * sc)}px; background:${accent}; pointer-events:none; }

      .transport { display:flex; align-items:center; justify-content:center; gap:${Math.round(22 * sc)}px; margin-bottom:${Math.round(20 * sc)}px; }
      .transport.hidden { display:none; }
      .tbtn {
        display:flex; align-items:center; justify-content:center;
        border:none; border-radius:50%; background:${p.surface}; color:${p.textSecondary};
        box-shadow:${softOut}; cursor:pointer; -webkit-tap-highlight-color:transparent;
        transition:box-shadow .12s ease, transform .05s ease;
        width:${Math.round(56 * sc)}px; height:${Math.round(56 * sc)}px;
      }
      .tbtn svg { width:${Math.round(24 * sc)}px; height:${Math.round(24 * sc)}px; pointer-events:none; }
      .tbtn:active { box-shadow:${softIn}; transform:translateY(0.5px); }
      .tbtn.play { width:${Math.round(74 * sc)}px; height:${Math.round(74 * sc)}px; color:${accent}; }
      .tbtn.play svg { width:${Math.round(30 * sc)}px; height:${Math.round(30 * sc)}px; }
      .tbtn.disabled { opacity:0.35; pointer-events:none; }
      ${cfg.display_only ? ".transport{display:none;}" : ""}

      .extras { display:flex; align-items:center; justify-content:space-between; }
      .extras.hidden { display:none; }
      .xbtn { width:${Math.round(40 * sc)}px; height:${Math.round(40 * sc)}px; display:flex; align-items:center; justify-content:center; border:none; border-radius:${Math.round(12 * sc)}px; background:${p.surface}; color:${p.textSecondary}; box-shadow:${softOutSm}; cursor:pointer; }
      .xbtn svg { width:${Math.round(18 * sc)}px; height:${Math.round(18 * sc)}px; pointer-events:none; }
      .xbtn.active { color:${accent}; box-shadow:${softIn}; }

      .source { margin-top:${Math.round(16 * sc)}px; }
      .source.hidden { display:none; }
      .source select {
        width:100%; padding:${Math.round(9 * sc)}px ${Math.round(12 * sc)}px; border:none; border-radius:${Math.round(12 * sc)}px;
        background:${p.surface}; color:${p.textPrimary}; box-shadow:${softIn};
        font-family:inherit; font-size:${(12 * sc).toFixed(1)}px; -webkit-appearance:none; appearance:none; cursor:pointer;
      }
      .off-note { text-align:center; color:${p.textFaint}; font-size:${(12 * sc).toFixed(1)}px; padding:${Math.round(20 * sc)}px 0; }
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
        const sr = this.shadowRoot;
        const s = this._stateObj;
        const cfg = this._config;

        // Header
        const header = sr.getElementById("mp-header");
        if (header) {
            header.className = "mp-header" + (cfg.show_header === false ? " hidden" : "");
            const label = sr.getElementById("mp-label");
            if (label && labelVisible(cfg.header_label)) {
                const custom = (cfg.header_label && cfg.header_label.text) || cfg.name;
                label.textContent = custom || (s ? this._stateVerb(s.state) : "Playing");
                applyTypography(label, cfg.header_label);
            } else if (label) { label.textContent = ""; }
        }

        // Header group button — only when the active player supports grouping.
        const groupBtn = sr.getElementById("mp-group");
        if (groupBtn) groupBtn.style.display = (this._config.show_grouping !== false && this._supports(MF.GROUPING)) ? "" : "none";

        this._renderSwitcher();

        if (!s) {
            const t = sr.getElementById("mp-title"); if (t) t.textContent = cfg.entity || "Unavailable";
            const a = sr.getElementById("mp-artist"); if (a) a.textContent = this._t("unavailable");
            ["mp-progress", "mp-transport", "mp-extras", "mp-volume", "mp-source", "mp-group-panel"].forEach((id) => { const e = sr.getElementById(id); if (e) e.classList.add("hidden"); });
            return;
        }

        this._renderGrouping();

        if (s.state === "off" || s.state === "standby") {
            this._renderOff();
            return;
        }

        this._renderArt();
        this._renderMeta();
        this._renderProgress();
        this._renderVolume();
        this._renderTransport();
        this._renderExtras();
        this._renderSource();
    }

    _t(key) {
        const lang = mpLang(this._hass);
        return (MP_I18N[lang] && MP_I18N[lang][key]) || MP_I18N.en[key] || key;
    }
    _stateVerb(state) {
        return state === "playing" ? this._t("Playing") : state === "paused" ? this._t("Paused") : state === "buffering" ? this._t("Buffering") : state === "idle" ? this._t("Idle") : this._t("Playing");
    }

    _renderOff() {
        const sr = this.shadowRoot;
        ["mp-art", "mp-progress", "mp-transport", "mp-extras", "mp-volume", "mp-source"].forEach((id) => { const e = sr.getElementById(id); if (e) e.classList.add("hidden"); });
        const meta = sr.querySelector(".meta");
        const t = sr.getElementById("mp-title"); if (t) t.textContent = "";
        const a = sr.getElementById("mp-artist"); if (a) a.textContent = "";
        let note = sr.getElementById("mp-offnote");
        if (!note) { note = document.createElement("div"); note.id = "mp-offnote"; note.className = "off-note"; meta.appendChild(note); }
        note.innerHTML = `${this._t("Off")} &middot; <button class="hbtn" id="mp-poweron" style="display:inline-flex;vertical-align:middle" aria-label="Turn on">${this._powerIcon()}</button>`;
        const btn = note.querySelector("#mp-poweron");
        if (btn && this._supports(MF.TURN_ON)) btn.addEventListener("click", () => this._svc("turn_on"));
    }
    _powerIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v9"/><path d="M6.6 6.6a8 8 0 1010.8 0"/></svg>`; }

    // ── Player switcher (which player this card controls) ───────────────────────
    _renderSwitcher() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-switcher");
        if (!wrap) return;
        const players = this._players || [];
        if (this._config.show_player_switcher === false || players.length < 2) { wrap.classList.add("hidden"); wrap.innerHTML = ""; return; }
        wrap.classList.remove("hidden");
        wrap.innerHTML = players.map((pl) => {
            const st = this._hass && this._hass.states[pl.entity];
            const name = pl.name || (st && st.attributes.friendly_name) || pl.entity.split(".")[1];
            const active = pl.entity === this._activeEntity;
            const playing = st && st.state === "playing";
            const icon = pl.icon ? "" : this._speakerIcon();
            return `<button class="chip-sw ${active ? "active" : ""}" data-mpaction="switch" data-ent="${pl.entity}" title="${name}">
              ${playing && !active ? `<span class="live"></span>` : icon}
              <span>${name}</span></button>`;
        }).join("");
        // Clicks handled by delegation on the card root.
    }
    _speakerIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><circle cx="12" cy="14" r="3.5"/><circle cx="12" cy="6" r="1"/></svg>`; }

    // ── Speaker grouping (play the same audio on several players) ────────────────
    _renderGrouping() {
        const sr = this.shadowRoot;
        const panel = sr.getElementById("mp-group-panel");
        if (!panel) return;
        if (!this._groupingOpen || !this._supports(MF.GROUPING) || this._config.show_grouping === false) {
            panel.className = "group-panel"; panel.innerHTML = ""; return;
        }
        panel.className = "group-panel open";
        const s = this._stateObj;
        const master = this._activeEntity;
        const grouped = s.attributes.group_members || [];
        // Candidate members: all media_players that also support grouping.
        const candidates = Object.keys(this._hass.states)
            .filter((e) => e.startsWith("media_player.") && e !== master)
            .filter((e) => (Number(this._hass.states[e].attributes.supported_features || 0) & MF.GROUPING) === MF.GROUPING);
        const masterName = s.attributes.friendly_name || master.split(".")[1];
        let html = `<div class="group-title">${this._t("play_on")}</div>`;
        html += `<div class="group-row" data-master="1"><span class="gname master">${masterName}</span>
          <span class="gcheck on">${this._checkIcon()}</span></div>`;
        for (const ent of candidates) {
            const st = this._hass.states[ent];
            const nm = st.attributes.friendly_name || ent.split(".")[1];
            const joined = grouped.includes(ent);
            html += `<div class="group-row" data-mpaction="grouprow" data-ent="${ent}"><span class="gname">${nm}</span>
              <span class="gcheck ${joined ? "on" : ""}">${joined ? this._checkIcon() : ""}</span></div>`;
        }
        if (!candidates.length) html += `<div class="group-row"><span class="gname" style="opacity:.6">${this._t("no_group")}</span></div>`;
        panel.innerHTML = html;
        // Clicks handled by delegation on the card root.
    }
    _checkIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 6"/></svg>`; }

    _renderArt() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-art");
        if (!wrap) return;
        wrap.classList.remove("hidden");
        const s = this._stateObj;
        const pic = s.attributes.entity_picture;
        let url = null;
        if (pic) {
            if (pic.startsWith("http")) url = pic;
            else if (pic.startsWith("/")) {
                if (this._hass && typeof this._hass.hassUrl === "function") url = this._hass.hassUrl(pic);
                else url = pic;
            } else url = pic;
        }
        const circle = this._config.art_shape === "circle";
        const wantSpin = circle && this._config.spin_art !== false && !!url;
        const playing = s.state === "playing";

        // Only rebuild the DOM when the image or shape actually changes — otherwise
        // the CSS rotation would restart from 0° on every hass update and stutter.
        const sig = `${url || "none"}|${circle}|${wantSpin}`;
        if (this._artSig !== sig) {
            this._artSig = sig;
            if (url) {
                wrap.innerHTML = `<div class="art-disc"><div class="art-img${wantSpin ? " spin" : ""}" style="background-image:url('${url}')"></div></div>`;
            } else {
                wrap.innerHTML = `<div class="art-disc"><div class="art-img placeholder">${this._noteIcon()}</div></div>`;
            }
        }
        // Pause/resume the rotation with play state WITHOUT restarting it.
        if (wantSpin) {
            const img = wrap.querySelector(".art-img.spin");
            if (img) img.style.animationPlayState = playing ? "running" : "paused";
        }
    }
    _noteIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg>`; }

    _renderMeta() {
        const sr = this.shadowRoot;
        const s = this._stateObj;
        const note = sr.getElementById("mp-offnote"); if (note) note.remove();
        const t = sr.getElementById("mp-title");
        const a = sr.getElementById("mp-artist");
        if (t) {
            const vis = labelVisible(this._config.title_label);
            t.style.display = vis ? "" : "none";
            if (vis) {
                t.textContent = (this._config.title_label && this._config.title_label.text) || s.attributes.media_title || s.attributes.friendly_name || "—";
                applyTypography(t, this._config.title_label);
            }
        }
        if (a) {
            const vis = labelVisible(this._config.artist_label);
            a.style.display = vis ? "" : "none";
            if (vis) {
                const sub = s.attributes.media_artist || s.attributes.media_album_name || s.attributes.media_series_title || "";
                a.textContent = (this._config.artist_label && this._config.artist_label.text) || sub;
                applyTypography(a, this._config.artist_label);
            }
        }
    }

    _renderProgress() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-progress");
        if (!wrap) return;
        if (this._config.show_progress === false || !this._duration) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        const pos = clamp(this._position, 0, this._duration);
        const pct = this._duration ? (pos / this._duration) * 100 : 0;
        wrap.innerHTML = `
      <div class="times"><span>${fmtTime(pos)}</span><span>${fmtTime(this._duration)}</span></div>
      <div class="bar" id="mp-bar">
        <div class="bar-fill" style="width:${pct}%; pointer-events:none;"></div>
        <div class="bar-knob" style="left:${pct}%; pointer-events:none;"></div>
      </div>`;
        // Seek handled by delegation on the card root.
    }

    _renderVolume() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-volume");
        if (!wrap) return;
        if (this._config.show_volume === false || !this._supports(MF.VOLUME_SET)) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        const s = this._stateObj;
        const vol = Number(s.attributes.volume_level || 0);
        const muted = !!s.attributes.is_volume_muted;
        const canMute = this._supports(MF.VOLUME_MUTE);
        wrap.innerHTML = `
      ${canMute ? `<button class="vbtn ${muted ? "active" : ""}" id="mp-mute" aria-label="Mute">${muted ? this._muteIcon() : this._volIcon()}</button>` : ""}
      <div class="vbar" id="mp-vbar"><div class="vbar-fill" style="width:${(muted ? 0 : vol) * 100}%"></div></div>`;
        // Clicks handled by delegation on the card root.
    }
    _volIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M16 8a5 5 0 010 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`; }
    _muteIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4z"/><path d="M22 9l-6 6M16 9l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`; }

    _renderTransport() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-transport");
        if (!wrap) return;
        if (this._config.display_only) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        const s = this._stateObj;
        const playing = s.state === "playing";
        const canPrev = this._supports(MF.PREVIOUS_TRACK);
        const canNext = this._supports(MF.NEXT_TRACK);
        const canPlay = this._supports(MF.PLAY) || this._supports(MF.PAUSE) || true;
        wrap.innerHTML = `
      <button class="tbtn ${canPrev ? "" : "disabled"}" id="mp-prev" aria-label="Previous">${this._prevIcon()}</button>
      <button class="tbtn play" id="mp-play" aria-label="${playing ? "Pause" : "Play"}">${playing ? this._pauseIcon() : this._playIcon()}</button>
      <button class="tbtn ${canNext ? "" : "disabled"}" id="mp-next" aria-label="Next">${this._nextIcon()}</button>`;
        // Clicks handled by delegation on the card root (see _onDelegatedClick).
    }
    _prevIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM20 6L10 12l10 6V6z"/></svg>`; }
    _nextIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM4 6l10 6L4 18V6z"/></svg>`; }
    _playIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`; }
    _pauseIcon() { return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`; }

    _renderExtras() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-extras");
        if (!wrap) return;
        const cfg = this._config;
        const s = this._stateObj;
        const canShuffle = this._supports(MF.SHUFFLE_SET);
        const canRepeat = this._supports(MF.REPEAT_SET);
        if (cfg.show_shuffle_repeat === false || cfg.display_only || (!canShuffle && !canRepeat)) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        const shuffle = !!s.attributes.shuffle;
        const repeat = s.attributes.repeat || "off";
        wrap.innerHTML = `
      ${canShuffle ? `<button class="xbtn ${shuffle ? "active" : ""}" id="mp-shuffle" aria-label="Shuffle">${this._shuffleIcon()}</button>` : `<span style="width:1px"></span>`}
      ${canRepeat ? `<button class="xbtn ${repeat !== "off" ? "active" : ""}" id="mp-repeat" aria-label="Repeat">${repeat === "one" ? this._repeatOneIcon() : this._repeatIcon()}</button>` : `<span style="width:1px"></span>`}`;
        // Clicks handled by delegation on the card root.
    }
    _shuffleIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/></svg>`; }
    _repeatIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>`; }
    _repeatOneIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/><text x="11" y="15" font-size="8" font-family="monospace" fill="currentColor" stroke="none">1</text></svg>`; }

    _renderSource() {
        const sr = this.shadowRoot;
        const wrap = sr.getElementById("mp-source");
        if (!wrap) return;
        const s = this._stateObj;
        const list = s.attributes.source_list;
        if (this._config.show_source === false || this._config.display_only || !this._supports(MF.SELECT_SOURCE) || !Array.isArray(list) || !list.length) { wrap.classList.add("hidden"); return; }
        wrap.classList.remove("hidden");
        const cur = s.attributes.source;
        wrap.innerHTML = `<select id="mp-src">${list.map((x) => `<option value="${String(x).replace(/"/g, "&quot;")}"${x === cur ? " selected" : ""}>${x}</option>`).join("")}</select>`;
        // Change handled by delegation on the card root.
    }

    // ── Services ────────────────────────────────────────────────────────────────
    // Set an optimistic overlay for instant feedback, with a safety net that
    // clears it if the real state never confirms (failed service call, etc.).
    _setOptimistic(obj) {
        this._optimistic = obj;
        if (this._optTimer) clearTimeout(this._optTimer);
        this._optTimer = setTimeout(() => {
            this._optimistic = null;
            this._optTimer = null;
            if (this.shadowRoot) this._render();
        }, 2500);
    }

    _svc(service, data) {
        if (!this._hass || !this._config) return;
        const ent = this._activeEntity || this._config.entity;
        this._hass.callService("media_player", service, Object.assign({ entity_id: ent }, data || {}));
    }
    _moreInfo() {
        const ev = new CustomEvent("hass-more-info", { detail: { entityId: this._activeEntity || this._config.entity }, bubbles: true, composed: true });
        this.dispatchEvent(ev);
    }
}

// ── Editor ────────────────────────────────────────────────────────────────────
const MP_EDITOR_CSS = `
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

class NeumorphicMediaPlayerCardEditor extends HTMLElement {
    constructor() { super(); this._hass = null; this._config = {}; this._sections = {}; this._built = false; }
    set hass(hass) { this._hass = hass; const ep = this.shadowRoot && this.shadowRoot.getElementById("entity_picker"); if (ep) ep.hass = hass; }
    setConfig(config) { this._config = Object.assign({}, config); if (!this._built) { this.attachShadow({ mode: "open" }); this._built = true; } this._render(); }
    _get(path, fb = "") { const v = path.split(".").reduce((o, k) => (o != null && typeof o === "object") ? o[k] : undefined, this._config); return v !== undefined && v !== null ? v : fb; }
    _set(path, value) {
        const parts = path.split("."); let cur = this._config;
        for (let i = 0; i < parts.length - 1; i++) { if (cur[parts[i]] == null || typeof cur[parts[i]] !== "object") cur[parts[i]] = {}; cur = cur[parts[i]]; }
        if (value === "" || value === undefined || value === null) delete cur[parts[parts.length - 1]]; else cur[parts[parts.length - 1]] = value;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: Object.assign({}, this._config) }, bubbles: true, composed: true }));
    }
    _loadFont(family) {
        if (!family || WEB_SAFE.has(family)) return;
        const id = `gfont-${family.replace(/\s+/g, "-")}`;
        if (document.getElementById(id)) return;
        const link = Object.assign(document.createElement("link"), { id, rel: "stylesheet", href: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}:wght@300;400;500;600;700;900&display=swap` });
        document.head.appendChild(link);
    }
    _toggleSection(id) { this._sections[id] = !this._sections[id]; const h = this.shadowRoot.querySelector(`[data-sec="${id}"]`); const b = this.shadowRoot.querySelector(`[data-secbody="${id}"]`); if (h) h.classList.toggle("collapsed", !!this._sections[id]); if (b) b.classList.toggle("hidden", !!this._sections[id]); }
    _sec(id, title, body) { const c = !!this._sections[id]; return `<div class="sec-hdr${c ? " collapsed" : ""}" data-sec="${id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>${title}</div><div class="sec-body${c ? " hidden" : ""}" data-secbody="${id}">${body}</div>`; }
    _entityPicker() { const v = this._get("entity"); if (customElements.get("ha-entity-picker")) return `<ha-entity-picker id="entity_picker" data-path="entity" .value="${v}" value="${v}" include-domains='["media_player"]' allow-custom-entity></ha-entity-picker>`; return `<input type="text" data-path="entity" value="${String(v).replace(/"/g, "&quot;")}" placeholder="media_player.living_room">`; }
    _entitiesText() {
        const list = this._config.entities;
        if (!Array.isArray(list)) return "";
        return list.map((e) => (typeof e === "string" ? e : (e && e.entity) || "")).filter(Boolean).join("\n").replace(/</g, "&lt;");
    }
    _text(path, lbl, ph = "") { return `<div class="field"><label>${lbl}</label><input type="text" data-path="${path}" value="${String(this._get(path, "")).replace(/"/g, "&quot;")}" placeholder="${ph}"></div>`; }
    _range(path, lbl, min, max, step, suffix = "", def = min) { const v = Number(this._get(path, def)); return `<div class="field"><label>${lbl}</label><div class="range-wrap"><input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}" data-suffix="${suffix}"><span class="range-val" data-rv="${path}">${v}${suffix}</span></div></div>`; }
    _select(path, lbl, opts) { const cur = String(this._get(path, opts[0].value)); return `<div class="field"><label>${lbl}</label><select data-path="${path}">${opts.map((o) => `<option value="${o.value}"${cur === o.value ? " selected" : ""}>${o.label}</option>`).join("")}</select></div>`; }
    _toggle(path, lbl, def = false) { return `<div class="tog-row"><label>${lbl}</label><label class="switch"><input type="checkbox" data-path="${path}"${Boolean(this._get(path, def)) ? " checked" : ""}><span class="sw-track"></span></label></div>`; }
    _color(path, lbl, def = "#006666") { let raw = String(this._get(path, "") || def); if (!/^#[0-9a-fA-F]{6}$/i.test(raw)) raw = def; return `<div class="field"><label>${lbl}</label><div class="color-field" data-colorpath="${path}"><div class="color-swatch" style="background:${raw}"><input type="color" value="${raw}"></div><input type="text" class="color-hex" value="${raw.toUpperCase()}" placeholder="#RRGGBB" maxlength="7"></div></div>`; }
    _font(path, lbl) { const cur = String(this._get(path, "")); const isC = cur !== "" && !FONT_PRESETS.find((p) => p.v === cur && p.v !== "__custom__"); const sel = isC ? "__custom__" : cur; return `<div class="field"><label>${lbl}</label><select data-path="${path}" data-font-sel>${FONT_PRESETS.map((p) => `<option value="${p.v}"${sel === p.v ? " selected" : ""}>${p.l}</option>`).join("")}</select><input type="text" data-path="${path}" data-font-custom placeholder="e.g. Dancing Script" style="${isC ? "" : "display:none"}" value="${isC ? cur : ""}"><small class="font-hint">Google Fonts load automatically.</small></div>`; }
    _labelBlock(prefix, hasText = true) {
        return `${this._toggle(`${prefix}.show`, "Visible", true)}${hasText ? this._text(`${prefix}.text`, "Text override", "blank = auto") : ""}<div class="row2">${this._text(`${prefix}.size`, "Size (e.g. 14px)", "14px")}${this._select(`${prefix}.weight`, "Weight", [{ value: "", label: "Default" }, { value: "300", label: "300" }, { value: "400", label: "400" }, { value: "500", label: "500" }, { value: "600", label: "600" }, { value: "700", label: "700" }, { value: "900", label: "900" }])}</div>${this._font(`${prefix}.font`, "Font family")}<div class="row2">${this._select(`${prefix}.transform`, "Transform", [{ value: "", label: "None" }, { value: "uppercase", label: "UPPERCASE" }, { value: "lowercase", label: "lowercase" }, { value: "capitalize", label: "Capitalize" }])}${this._text(`${prefix}.spacing`, "Letter spacing", "0.04em")}</div>${this._color(`${prefix}.color`, "Color", "#1E2938")}`;
    }
    _render() {
        const sr = this.shadowRoot;
        const html = `
      ${this._sec("entity", "🎵 Media Player", `<div class="field"><label>Primary entity (media_player.*)</label>${this._entityPicker()}</div>
        <div class="field"><label>Additional players for the switcher (one per line)</label>
        <textarea data-path="__entities__" placeholder="media_player.kitchen&#10;media_player.bedroom" style="width:100%;min-height:60px;padding:8px 10px;border-radius:6px;border:1px solid var(--divider-color,#d1d5db);background:var(--card-background-color,#fff);color:var(--primary-text-color,#111);font-size:12px;font-family:monospace;box-sizing:border-box;">${this._entitiesText()}</textarea>
        <small class="font-hint">The primary entity plus these appear as switch chips. Leave blank for a single player.</small></div>
        ${this._text("name", "Header label", "Playing")}`)}
      ${this._sec("layout", "📐 Layout", `${this._range("card_size", "Card width (px)", 260, 460, 10, "px", 340)}${this._select("art_shape", "Album art shape", [{ value: "circle", label: "Circle" }, { value: "squircle", label: "Squircle" }, { value: "square", label: "Square" }])}${this._toggle("spin_art", "Rotate circular art", true)}${this._range("spin_speed", "Rotation speed (sec/turn)", 2, 60, 1, "s", 12)}${this._toggle("no_border", "No border / transparent background")}${this._toggle("display_only", "Display only — hide controls")}`)}
      ${this._sec("sections", "🎛 Sections", `${this._toggle("show_player_switcher", "Player switcher chips", true)}${this._toggle("show_grouping", "Speaker grouping button", true)}${this._toggle("show_header", "Header row (back / label / menu)", true)}${this._toggle("show_progress", "Progress bar + times", true)}${this._toggle("show_volume", "Volume row")}${this._toggle("show_shuffle_repeat", "Shuffle / repeat row", true)}${this._toggle("show_source", "Source dropdown")}`)}
      ${this._sec("colors", "🎨 Colours", `${this._color("accent_color", "Accent (fill + play icon)", "#006666")}`)}
      ${this._sec("header_lbl", "𝗔 Header Label", this._labelBlock("header_label", true))}
      ${this._sec("title_lbl", "① Title", this._labelBlock("title_label", true))}
      ${this._sec("artist_lbl", "② Artist", this._labelBlock("artist_label", true))}
    `;
        const style = document.createElement("style"); style.textContent = MP_EDITOR_CSS;
        const div = document.createElement("div"); div.innerHTML = html;
        const ep = div.querySelector("#entity_picker");
        if (ep) { ep.hass = this._hass; ep.addEventListener("value-changed", (e) => this._set("entity", e.detail.value)); }
        // Additional players textarea → entities array
        div.querySelectorAll('textarea[data-path="__entities__"]').forEach((el) => {
            el.addEventListener("change", () => {
                const arr = el.value.split("\n").map((s) => s.trim()).filter(Boolean);
                if (arr.length) this._config.entities = arr; else delete this._config.entities;
                this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: Object.assign({}, this._config) }, bubbles: true, composed: true }));
            });
        });
        div.querySelectorAll('input[type=text][data-path="entity"]').forEach((el) => el.addEventListener("change", () => this._set("entity", el.value.trim() || undefined)));
        div.querySelectorAll("input[type=text][data-path]:not(.color-hex):not([data-font-custom]):not([data-path='entity'])").forEach((el) => {
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

customElements.define("neumorphic-media-player-editor", NeumorphicMediaPlayerCardEditor);
customElements.define("neumorphic-media-player-card", NeumorphicMediaPlayerCard);
window.customCards = (_a = window.customCards) !== null && _a !== void 0 ? _a : [];
window.customCards.push({
    type: "neumorphic-media-player-card",
    name: "Neumorphic Media Player",
    description: "Soft-UI now-playing card with album art, transport, progress, and volume — Neumorphic theme",
    preview: true,
});
