/**
 * Neumorphic Slider Card  v2  —  UNIFIED
 * ─────────────────────────────────────────────────────────────────────────────
 * Single card, orientation: vertical (default) | horizontal.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  type: custom:neumorphic-slider-card                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ── Orientation ────────────────────────────────────────────────────────────
 *   orientation: vertical            # vertical (default) | horizontal
 *
 * ── Entity & value range ───────────────────────────────────────────────────
 *   entity: light.living_room        # REQUIRED
 *   min: 0  /  max: 100  /  step: 1
 *   attribute: brightness            # HA attribute; brightness auto-scaled 0-100
 *   service: light.turn_on  /  service_data_key: brightness_pct
 *
 * ── Labels & visibility ────────────────────────────────────────────────────
 *   name: Brightness   unit: "%"   icon: mdi:brightness-6
 *   show_value: true   show_range: true   show_border: true   show_icon_border: true
 *   label_min: "Off"   label_max: "Max"
 *
 * ── Fill ───────────────────────────────────────────────────────────────────
 *   fill_mode: solid                 # solid | none | gradient
 *   fill_color_start: "#56d3f5"      # gradient start (bottom/left)
 *   fill_color_end:   "#e0c97f"      # gradient end   (top/right)
 *   fill_opacity: 0.72
 *
 * ── Colors ─────────────────────────────────────────────────────────────────
 *   color: "#e0c97f"   background_color: "#e0e5ec"
 *   shadow_dark: "rgba(163,177,198,0.6)"   shadow_light: "rgba(255,255,255,0.9)"
 *   text_color: "#3d4f6b"   label_color: "#8a9bb2"   icon_color: ""
 *
 * ── Glow ───────────────────────────────────────────────────────────────────
 *   glow: true
 *   glow_intensity: 0.6     # 0–1 scalar; 0=off 0.3=subtle 0.6=normal 1.0=blazing
 *   glow_size: 18   glow_opacity: 0.55
 *
 * ── Thumb — axis-aware sizing ──────────────────────────────────────────────
 *   thumb_thickness: 46      # size ACROSS the travel direction
 *                            #   vertical   → CSS width  (left ↔ right)
 *                            #   horizontal → CSS height (up ↕ down)
 *   thumb_length: 24         # size ALONG the travel direction
 *                            #   vertical   → CSS height (up ↕ down)
 *                            #   horizontal → CSS width  (left ↔ right)
 *
 *   thumb_shape: pill        # pill (default) | rounded | square
 *   thumb_radius: 12         # explicit — overrides thumb_shape
 *   thumb_shadow_size: 5
 *
 *   Low-level (bypass axis mapping, take priority):
 *   thumb_width: 46   thumb_height: 24
 *
 * ── Track ──────────────────────────────────────────────────────────────────
 *   track_length: 280        # travel distance px (height V / fills width H)
 *   track_thickness: 6       # groove width V or groove height H
 *   track_radius: 3
 *
 * ── Icon ───────────────────────────────────────────────────────────────────
 *   icon_size: 46   icon_box_radius: 13   icon_mdi_size: 22
 *
 * ── Card shell ─────────────────────────────────────────────────────────────
 *   card_radius: 22   card_padding: "24px 20px 20px"   card_shadow_size: 7
 *
 * ── Spacing ────────────────────────────────────────────────────────────────
 *   header_gap: 6   header_margin: 18   footer_margin: 14
 *
 * ── Typography ─────────────────────────────────────────────────────────────
 *   font_name: "0.76rem"   font_value: "1.05rem"   font_range: "0.68rem"
 *
 * ── Grip ───────────────────────────────────────────────────────────────────
 *   grip_lines: 3   grip_width: 18   grip_height: 2   grip_gap: 3.5
 */

class NeumorphicSliderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._dragging = false;
    this._value    = null;
    this._config   = {};
    this._bound_onMove = this._onMove.bind(this);
    this._bound_onUp   = this._onUp.bind(this);
  }

  /* ─── HA lifecycle ──────────────────────────────────────────────── */

  set hass(hass) {
    this._hass = hass;
    if (!this._config.entity) return;
    const stateObj = hass.states[this._config.entity];
    if (!stateObj) return;

    const c = this._config;
    let raw;

    if (c.attribute) {
      /* explicit attribute requested */
      raw = stateObj.attributes[c.attribute];
      if (c.attribute === "brightness" && raw !== undefined)
        raw = Math.round((raw / 255) * 100);
    } else {
      const state = stateObj.state;
      if (state === "unavailable" || state === "unknown") {
        raw = c.min;
      } else {
        const num = parseFloat(state);
        if (!isNaN(num)) {
          /* numeric state (input_number, sensor, etc.) */
          raw = num;
        } else {
          /* non-numeric state (on/off, etc.) — try brightness attribute */
          const domain = c.entity.split(".")[0];
          if (domain === "light" && stateObj.attributes.brightness !== undefined) {
            raw = Math.round((stateObj.attributes.brightness / 255) * 100);
          } else if (state === "on") {
            raw = c.max;
          } else if (state === "off") {
            raw = c.min;
          } else {
            raw = c.min;
          }
        }
      }
    }

    if (raw == null || isNaN(raw)) raw = c.min;
    raw = Math.min(c.max, Math.max(c.min, raw));
    if (!this._dragging && raw !== this._value) { this._value = raw; this._updateVisuals(); }
  }

  setConfig(config) {
    if (!config.entity) throw new Error("neumorphic-slider-card: 'entity' is required");

    const isH = (config.orientation || "vertical") === "horizontal";

    this._config = {
      orientation:     "vertical",
      min: 0, max: 100, step: 1,
      show_value: true, show_range: true, show_border: true, show_icon_border: true,
      display_only: false,         // true = read-only display, no slider/track/thumb/range labels
      /* use_theme_colors: false (default) — use explicit color config values
         use_theme_colors: true            — pull all colors from HA theme CSS vars,
         ignoring background_color, shadow_dark, shadow_light, text_color, label_color */
      use_theme_colors: false,
      /* label_position: "start" (default) | "end"
         start = before the slider (top for V, left for H)
         end   = after  the slider (bottom for V, right for H)
         label_main  = primary label (replaces/aliases "name")
         label_minor = secondary smaller label below label_main  */
      label_position: "start",
      fill_mode: "solid", fill_opacity: 0.72,
      glow: true, glow_size: 18, glow_opacity: 0.55,
      color: "#e0c97f", background_color: "#e0e5ec",
      shadow_dark: "rgba(163,177,198,0.6)", shadow_light: "rgba(255,255,255,0.9)",
      text_color: "#3d4f6b", label_color: "#8a9bb2",
      /* track */
      track_length:    isH ? 0 : 280,   // 0 = stretch-to-fill for horizontal
      track_thickness: 6,
      track_radius:    3,
      /* thumb axis-aware defaults */
      thumb_thickness: isH ? 24 : 46,   // across travel (narrow dim)
      thumb_length:    isH ? 46 : 24,   // along  travel (long  dim)
      thumb_shadow_size: 5,
      // thumb_shape: round (default) | squircle | square
      /* icon */
      icon_size: isH ? 38 : 46, icon_box_radius: isH ? 11 : 13, icon_mdi_size: isH ? 20 : 22,
      /* card */
      card_radius: 22, card_padding: isH ? "20px 24px 18px" : "24px 20px 20px", card_shadow_size: 7,
      /* spacing */
      header_gap: isH ? 10 : 6, header_margin: isH ? 16 : 18, footer_margin: isH ? 10 : 14,
      /* typography */
      font_name: "0.76rem", font_value: "1.05rem", font_range: "0.68rem",
      /* grip */
      grip_lines: 3, grip_width: isH ? 12 : 18, grip_height: 2, grip_gap: 3.5,
      /* icon animation */
      icon_animation:         "none",  // none | spin | pulse | bounce | shake | ping | blink
      icon_animation_speed_min: 3.0,   // seconds at value=min (slowest)
      icon_animation_speed_max: 0.2,   // seconds at value=max (fastest)
      ...config,
    };

    const c = this._config;
    if (!c.icon_color) c.icon_color = c.color;

    /* ── label_main / label_minor aliases ─────────────────────────
     * "name" still works as backward-compat alias for label_main.
     * Explicit empty string in label_main means "no label" — do NOT
     * fall back to name in that case.                               */
    if (c.label_main === undefined && c.name) c.label_main = c.name;
    /* Treat explicit empty string as "hide label" */
    if (c.label_main === "") c.label_main = undefined;
    if (c.label_minor === "") c.label_minor = undefined;

    /* ── Resolve pixel dims from axis-aware names ──────────────────
     *
     *  VERTICAL:   CSS width  = thumb_thickness  (across = left-right)
     *              CSS height = thumb_length      (along  = up-down)
     *
     *  HORIZONTAL: CSS width  = thumb_length      (along  = left-right)
     *              CSS height = thumb_thickness   (across = up-down)
     *
     *  Explicit thumb_width / thumb_height always win.               */
    if (c.thumb_width  === undefined) c.thumb_width  = isH ? c.thumb_length    : c.thumb_thickness;
    if (c.thumb_height === undefined) c.thumb_height = isH ? c.thumb_thickness : c.thumb_length;

    /* ── thumb_shape → radius ──────────────────────────────────────────
     *  New names:  round | squircle | square
     *  Old aliases: pill → round,  rounded → squircle  (back-compat)
     *
     *  round     → fully rounded short side (radius = thickness/2)
     *  squircle  → smooth rounded rectangle (~30% of short side)
     *  square    → barely rounded corners (2px, almost sharp)
     *
     *  explicit thumb_radius always wins over shape                    */
    if (c.thumb_radius === undefined) {
      const ref  = c.thumb_thickness;
      const shape = c.thumb_shape;
      if      (shape === "square")                    c.thumb_radius = 2;
      else if (shape === "squircle" || shape === "rounded") c.thumb_radius = Math.round(ref * 0.30);
      else                                            c.thumb_radius = Math.round(ref / 2); // round / pill / default
    }

    /* ── glow_intensity → size + opacity ── */
    if (c.glow_intensity !== undefined) {
      const t = Math.min(1, Math.max(0, c.glow_intensity));
      if (t === 0) { c.glow = false; }
      else {
        c.glow         = true;
        c.glow_size    = Math.round(4 + t * 28);
        c.glow_opacity = parseFloat((0.1 + t * 0.75).toFixed(2));
      }
    }

    this._value = c.min;
    this._render();
  }

  getCardSize() {
    return this._config.orientation === "horizontal" ? 1 : 3;
  }

  /* HA calls these to wire up the visual editor */
  static getConfigElement() {
    return document.createElement("neumorphic-slider-card-editor");
  }

  static getStubConfig() {
    return {
      entity:      "input_number.example",
      orientation: "vertical",
      name:        "Brightness",
      unit:        "%",
      color:       "#e0c97f",
    };
  }

  /* ─── Render ────────────────────────────────────────────────────── */

  _render() {
    const c   = this._config;
    const isH = c.orientation === "horizontal";
    const ss  = c.card_shadow_size;
    const ts  = c.thumb_shadow_size;
    const TW  = c.thumb_width;
    const TH  = c.thumb_height;

    /* ── colour resolution ─────────────────────────────────────────
     * use_theme_colors: true  → CSS var() references so HA theme vars
     *                           are applied automatically at paint time.
     *   --nm-bg           card / thumb background
     *   --nm-shadow-dark  dark shadow arm
     *   --nm-shadow-light light shadow arm
     *   --nm-text         value text colour
     *   --nm-label        label / range text colour
     *   --nm-accent       fill / glow accent colour
     *
     * The card injects a <style> block that sets these vars from the
     * neumorphic-template theme variables (or HA defaults) when
     * use_theme_colors is true.  Explicit config values always win
     * when use_theme_colors is false.                                */

    const useTheme = c.use_theme_colors === true;

    /* values used inline in JS (box-shadow strings etc.) */
    const bg  = useTheme ? "var(--nm-bg)"           : c.background_color;
    const acc = useTheme ? "var(--nm-accent)"        : c.color;
    const sd  = useTheme ? "var(--nm-shadow-dark)"  : c.shadow_dark;
    const sl  = useTheme ? "var(--nm-shadow-light)" : c.shadow_light;
    const tc  = useTheme ? "var(--nm-text)"         : c.text_color;
    const lc  = useTheme ? "var(--nm-label)"        : c.label_color;
    const ic  = useTheme ? "var(--nm-accent)"        : c.icon_color;

    /* theme variable injection block — only emitted when use_theme_colors */
    const themeVarsCSS = useTheme ? `
        :host {
          --nm-bg:           var(--primary-background-color,       #e0e5ec);
          --nm-accent:       var(--primary-color,                  #e0c97f);
          --nm-text:         var(--primary-text-color,             #3d4f6b);
          --nm-label:        var(--secondary-text-color,           #8a9bb2);
          --nm-shadow-dark:  var(--nm-shadow-dark-color,  var(--neumorphic-shadow-dark,  rgba(163,177,198,0.6)));
          --nm-shadow-light: var(--nm-shadow-light-color, var(--neumorphic-shadow-light, rgba(255,255,255,0.9)));
        }` : "";

    /* glow shadow string ─────────────────────────────────────────
     * In theme mode we cannot nest var() inside box-shadow colour
     * slots reliably, so we build the glow using the explicit
     * config opacity against the explicit color fallback.
     * When use_theme_colors the accent colour from the theme is
     * unknown at JS time, so we use the explicit c.color value
     * (or its default) for the glow rgba — a reasonable trade-off. */
    const glowColor   = c.color || "#e0c97f";
    const glowRgba    = c.glow ? this._hexToRgba(glowColor, c.glow_opacity) : null;
    const glowCSS     = c.glow ? `, 0 0 ${c.glow_size}px ${Math.round(c.glow_size*1.5)}px ${glowRgba}` : "";

    const hasHeader = c.icon || c.label_main || c.label_minor || c.show_value !== false;
    const minLabel  = c.label_min !== undefined ? c.label_min : `${c.min}${c.unit || ""}`;
    const maxLabel  = c.label_max !== undefined ? c.label_max : `${c.max}${c.unit || ""}`;
    const labelAtEnd = (c.label_position || "start") === "end";

    const fillBg =
      c.fill_mode === "none"     ? "transparent" :
      c.fill_mode === "gradient" ? (isH
        ? `linear-gradient(to right, ${c.fill_color_start || acc}, ${c.fill_color_end || acc})`
        : `linear-gradient(to top,   ${c.fill_color_start || acc}, ${c.fill_color_end || acc})`)
      : acc;

    const gripLines = Array(Math.max(1, c.grip_lines)).fill(0)
      .map(() => `<div class="grip-line"></div>`).join("");

    /* The label block HTML — shared for both start and end positions */
    const labelBlockHtml = hasHeader ? `<div class="header">
          ${c.icon  ? `<div class="icon-wrap"><div class="icon-anim" id="icon-anim"><ha-icon icon="${c.icon}"></ha-icon></div></div>` : ""}
          ${c.label_main ? `<div class="label-main">${c.label_main}</div>` : (isH && !labelAtEnd ? `<div class="spacer"></div>` : "")}
          ${c.label_minor ? `<div class="label-minor">${c.label_minor}</div>` : ""}
          ${c.show_value !== false ? `<div class="value-badge" id="value-badge">—</div>` : ""}
        </div>` : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family,'Nunito',sans-serif); }
        ${themeVarsCSS}

        .card {
          background:    ${c.show_border !== false ? bg : "transparent"};
          border-radius: ${c.show_border !== false ? c.card_radius + "px" : "0"};
          padding:       ${c.show_border !== false ? c.card_padding : "0"};
          box-shadow:    ${c.show_border !== false
            ? `${ss}px ${ss}px ${ss*2}px ${sd}, -${ss}px -${ss}px ${ss*2}px ${sl}` : "none"};
          display: flex; flex-direction: column;
          ${isH ? "" : "align-items: center;"}
          user-select: none; -webkit-user-select: none;
        }

        /* ── header — before or after slider ── */
        .header {
          display: flex;
          flex-direction: ${isH ? "row" : "column"};
          align-items: center;
          gap: ${c.header_gap}px;
          ${labelAtEnd
            ? `margin-top: ${c.header_margin}px;`
            : `margin-bottom: ${c.header_margin}px;`}
          width: 100%;
        }
        .icon-wrap {
          ${isH ? "flex-shrink: 0;" : ""}
          width: ${c.icon_size}px; height: ${c.icon_size}px;
          border-radius: ${c.icon_box_radius}px;
          background: ${c.show_icon_border !== false ? bg : "transparent"};
          box-shadow:  ${c.show_icon_border !== false ? `4px 4px 10px ${sd}, -4px -4px 10px ${sl}` : "none"};
          display: flex; align-items: center; justify-content: center;
        }
        .icon-wrap ha-icon { color: ${ic}; --mdc-icon-size: ${c.icon_mdi_size}px; }

        /* ── Icon animation keyframes ── */
        @keyframes nm-spin   { to { transform: rotate(360deg); } }
        @keyframes nm-pulse  { 0%,100% { transform: scale(1);    opacity: 1;   }
                               50%     { transform: scale(1.35); opacity: 0.7; } }
        @keyframes nm-bounce { 0%,100% { transform: translateY(0);    animation-timing-function: ease-in;  }
                               50%     { transform: translateY(-30%); animation-timing-function: ease-out; } }
        @keyframes nm-shake  { 0%,100% { transform: rotate(0deg);    }
                               20%     { transform: rotate(-15deg);   }
                               40%     { transform: rotate(15deg);    }
                               60%     { transform: rotate(-10deg);   }
                               80%     { transform: rotate(10deg);    } }
        @keyframes nm-ping   { 0%   { transform: scale(1);    opacity: 1;   }
                               75%  { transform: scale(1.5);  opacity: 0;   }
                               100% { transform: scale(1.5);  opacity: 0;   } }
        @keyframes nm-blink  { 0%,100% { opacity: 1;   }
                               50%     { opacity: 0.15; } }

        .icon-anim {
          display: flex; align-items: center; justify-content: center;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
          will-change: transform, opacity;
          transform-origin: center center;
        }

        /* ── label_main — primary title ── */
        .label-main {
          ${isH ? "flex: 1;" : ""}
          font-size: ${c.font_name}; font-weight: 700;
          letter-spacing: 0.07em; text-transform: uppercase; color: ${lc};
        }
        /* ── label_minor — secondary subtitle ── */
        .label-minor {
          ${isH ? "flex-shrink: 0;" : ""}
          font-size: ${c.font_minor || "0.65rem"}; font-weight: 500;
          letter-spacing: 0.04em; color: ${lc}; opacity: 0.72;
        }
        .value-badge {
          ${isH ? "flex-shrink: 0;" : ""}
          font-size: ${c.font_value}; font-weight: 800;
          color: ${tc}; letter-spacing: 0.02em;
        }
        .spacer { flex: 1; }

        .slider-area {
          position: relative;
          ${isH
            ? `width: 100%; height: ${TH}px; align-items: center; cursor: ew-resize;`
            : `width: 100%; height: ${c.track_length}px; align-items: center; justify-content: center; cursor: ns-resize;`}
          display: flex; touch-action: none;
        }

        .track {
          position: absolute;
          ${isH
            ? `top: 50%; transform: translateY(-50%); left: 0; right: 0; height: ${c.track_thickness}px;`
            : `left: 50%; transform: translateX(-50%); width: ${c.track_thickness}px; height: 100%;`}
          border-radius: ${c.track_radius}px;
          background: ${bg};
          box-shadow: inset 2px 2px 5px ${sd}, inset -2px -2px 5px ${sl};
          overflow: hidden;
        }
        .track-fill {
          position: absolute;
          ${isH ? "top: 0; left: 0; height: 100%;" : "bottom: 0; left: 0; width: 100%;"}
          border-radius: ${c.track_radius}px;
          background: ${fillBg};
          opacity: ${c.fill_mode === "none" ? 0 : c.fill_opacity};
          transition: ${isH ? "width" : "height"} 0.05s linear;
        }

        .thumb {
          position: absolute;
          ${isH ? "top: 50%; transform: translateY(-50%);" : "left: 50%; transform: translateX(-50%);"}
          width: ${TW}px; height: ${TH}px;
          border-radius: ${c.thumb_radius}px;
          background: ${bg};
          box-shadow: ${ts}px ${ts}px ${ts*2+2}px ${sd}, -${ts}px -${ts}px ${ts*2+2}px ${sl}${glowCSS};
          cursor: grab; transition: box-shadow 0.18s ease;
          display: flex; align-items: center; justify-content: center; z-index: 2;
        }
        .thumb.active {
          cursor: grabbing;
          box-shadow: 2px 2px 6px ${sd}, -2px -2px 6px ${sl}${glowCSS};
        }

        .grip { display: flex; flex-direction: column; gap: ${c.grip_gap}px; pointer-events: none; }
        .grip-line {
          width: ${c.grip_width}px; height: ${c.grip_height}px; border-radius: ${c.grip_height}px;
          background: linear-gradient(90deg, rgba(163,177,198,0.35), rgba(255,255,255,0.85), rgba(163,177,198,0.35));
        }

        /* ── Range labels ──
           Horizontal: single row min-left / max-right below track
           Vertical:   max above slider-area / min below slider-area,
                       centred, each in its own element               */
        .footer {
          ${isH
            ? `margin-top: ${c.footer_margin}px;
               width: 100%;
               display: flex; flex-direction: row;
               justify-content: space-between; padding: 0 3px;`
            : `display: contents;`}
        }
        .range-min, .range-max {
          font-size: ${c.font_range}; font-weight: 600; color: ${lc}; opacity: 0.75;
          text-align: center;
        }
        .range-max { margin-bottom: ${c.footer_margin}px; }
        .range-min { margin-top:    ${c.footer_margin}px; }
      </style>

      <div class="card">
        ${!labelAtEnd ? labelBlockHtml : ""}

        ${c.show_range !== false && !isH ? `<div class="range-max">${maxLabel}</div>` : ""}

        <div class="slider-area" id="slider-area" style="${c.display_only ? "cursor:default;" : ""}">
          <div class="track"><div class="track-fill" id="track-fill"></div></div>
          ${!c.display_only ? `<div class="thumb" id="thumb"><div class="grip">${gripLines}</div></div>` : ""}
        </div>

        ${c.show_range !== false ? (isH
          ? `<div class="footer"><span>${minLabel}</span><span>${maxLabel}</span></div>`
          : `<div class="range-min">${minLabel}</div>`) : ""}

        ${labelAtEnd ? labelBlockHtml : ""}
      </div>
    `;

    this._thumb      = this.shadowRoot.getElementById("thumb");
    this._fill       = this.shadowRoot.getElementById("track-fill");
    this._badge      = this.shadowRoot.getElementById("value-badge");
    this._sliderArea = this.shadowRoot.getElementById("slider-area");
    this._iconAnim   = this.shadowRoot.getElementById("icon-anim");
    if (!this._config.display_only) this._attachEvents();
    this._updateVisuals();
  }

  /* ─── Visuals ───────────────────────────────────────────────────── */

  _updateVisuals() {
    if (!this._badge && !this._fill) return;
    const c   = this._config;
    const isH = c.orientation === "horizontal";
    const pct = (this._value - c.min) / (c.max - c.min);

    /* value badge — always */
    if (this._badge)
      this._badge.textContent = `${this._fmt(this._value)}${c.unit || ""}`;

    /* fill bar — present in both normal and display_only mode */
    if (this._fill) {
      if (isH) this._fill.style.width  = `${pct * 100}%`;
      else     this._fill.style.height = `${pct * 100}%`;
    }

    /* thumb position — only in normal mode */
    if (!c.display_only && this._thumb) {
      if (isH) {
        const areaW  = this._sliderArea ? this._sliderArea.offsetWidth : 300;
        const usable = Math.max(1, areaW - c.thumb_width);
        this._thumb.style.left = `${pct * usable}px`;
      } else {
        const usable = Math.max(1, c.track_length - c.thumb_height);
        this._thumb.style.top = `${(1 - pct) * usable}px`;
      }

      /* live glow colour for gradient fill */
      if (c.glow && c.fill_mode === "gradient" && c.fill_color_start && c.fill_color_end) {
        const gc = this._lerpColor(c.fill_color_start, c.fill_color_end, pct);
        const gr = this._hexToRgba(gc, c.glow_opacity);
        const gs = c.glow_size, ts = c.thumb_shadow_size;
        this._thumb.style.boxShadow =
          `${ts}px ${ts}px ${ts*2+2}px ${c.shadow_dark}, -${ts}px -${ts}px ${ts*2+2}px ${c.shadow_light}` +
          `, 0 0 ${gs}px ${Math.round(gs * 1.5)}px ${gr}`;
      }
    }

    this._updateIconAnim(pct, c);
  }

  _updateIconAnim(pct, c) {
    if (!this._iconAnim) return;
    if (c.icon_animation && c.icon_animation !== "none") {
      const animName = `nm-${c.icon_animation}`;
      const sMin = parseFloat(c.icon_animation_speed_min);
      const sMax = parseFloat(c.icon_animation_speed_max);
      if (pct <= 0) {
        this._iconAnim.style.animationName      = animName;
        this._iconAnim.style.animationDuration  = `${sMin}s`;
        this._iconAnim.style.animationPlayState = "paused";
      } else {
        const dur = sMin + (sMax - sMin) * pct;
        this._iconAnim.style.animationName           = animName;
        this._iconAnim.style.animationDuration       = `${dur.toFixed(3)}s`;
        this._iconAnim.style.animationPlayState      = "running";
        this._iconAnim.style.animationTimingFunction =
          (c.icon_animation === "bounce") ? "cubic-bezier(0.33,0,0.66,0)" :
          (c.icon_animation === "shake")  ? "ease-in-out" : "linear";
      }
    } else {
      this._iconAnim.style.animationName = "none";
    }
  }

  _fmt(v) {
    return Number.isInteger(this._config.step) ? Math.round(v) : parseFloat(v.toFixed(1));
  }

  /* ─── Events ────────────────────────────────────────────────────── */

  _attachEvents() {
    this._sliderArea.addEventListener("mousedown",  e => this._onDown(e));
    this._sliderArea.addEventListener("touchstart", e => this._onDown(e), { passive: false });
  }
  _onDown(e) {
    e.preventDefault(); this._dragging = true; this._thumb.classList.add("active");
    this._processEvent(e);
    window.addEventListener("mousemove",  this._bound_onMove);
    window.addEventListener("touchmove",  this._bound_onMove, { passive: false });
    window.addEventListener("mouseup",    this._bound_onUp);
    window.addEventListener("touchend",   this._bound_onUp);
  }
  _onMove(e) { if (this._dragging) { e.preventDefault(); this._processEvent(e); } }
  _onUp() {
    if (!this._dragging) return;
    this._dragging = false; this._thumb.classList.remove("active");
    window.removeEventListener("mousemove",  this._bound_onMove);
    window.removeEventListener("touchmove",  this._bound_onMove);
    window.removeEventListener("mouseup",    this._bound_onUp);
    window.removeEventListener("touchend",   this._bound_onUp);
    this._callService();
  }

  _processEvent(e) {
    const touch = e.touches ? e.touches[0] : e;
    const rect  = this._sliderArea.getBoundingClientRect();
    const c     = this._config;
    const isH   = c.orientation === "horizontal";
    let pct;

    if (isH) {
      const usable = Math.max(1, rect.width - c.thumb_width);
      const relX = Math.min(usable, Math.max(0, touch.clientX - rect.left - c.thumb_width / 2));
      pct = relX / usable;
    } else {
      const half   = c.thumb_height / 2;
      const usable = Math.max(1, c.track_length - c.thumb_height);
      const relY   = Math.min(c.track_length - half, Math.max(half, touch.clientY - rect.top));
      pct = 1 - (relY - half) / usable;
    }

    const raw = c.min + pct * (c.max - c.min);
    this._value = Math.min(c.max, Math.max(c.min, Math.round(raw / c.step) * c.step));
    this._updateVisuals();
  }

  /* ─── Service ───────────────────────────────────────────────────── */

  _callService() {
    if (!this._hass) return;
    const c = this._config;
    if (c.service) {
      const [d, n] = c.service.split(".");
      this._hass.callService(d, n, { entity_id: c.entity, [c.service_data_key || "value"]: this._value });
      return;
    }
    const domain = c.entity.split(".")[0];
    const map = {
      light:        ["light",        "turn_on",            { brightness_pct: this._value }],
      cover:        ["cover",        "set_cover_position", { position:        this._value }],
      media_player: ["media_player", "volume_set",         { volume_level:    this._value / 100 }],
      climate:      ["climate",      "set_temperature",    { temperature:     this._value }],
      fan:          ["fan",          "set_percentage",     { percentage:      this._value }],
      input_number: ["input_number", "set_value",          { value:           this._value }],
    };
    const [d, n, data] = map[domain] || ["input_number", "set_value", { value: this._value }];
    this._hass.callService(d, n, { entity_id: c.entity, ...data });
  }

  /* ─── Util ──────────────────────────────────────────────────────── */

  _hexToRgba(hex, alpha) {
    if (!hex?.startsWith("#")) return `rgba(224,201,127,${alpha})`;
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  _lerpColor(a, b, t) {
    const p = hex => {
      let h = hex.replace("#","");
      if (h.length===3) h = h.split("").map(x=>x+x).join("");
      return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
    };
    const [r1,g1,b1] = p(a), [r2,g2,b2] = p(b);
    return `#${[
      Math.round(r1+(r2-r1)*t),
      Math.round(g1+(g2-g1)*t),
      Math.round(b1+(b2-b1)*t)
    ].map(v=>v.toString(16).padStart(2,"0")).join("")}`;
  }
}

customElements.define("neumorphic-slider-card", NeumorphicSliderCard);

/* ═══════════════════════════════════════════════════════════════════════════
   VISUAL EDITOR
   Registered as  neumorphic-slider-card-editor  (HA convention).
   HA injects:  setConfig(config)  and  set hass(hass)
   Editor fires: config-changed  CustomEvent with detail { config }
   ══════════════════════════════════════════════════════════════════════════ */

class NeumorphicSliderCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass   = null;
  }

  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  /* ── fire change up to HA ── */
  _fire(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }

  /* ── patch one key and fire ── */
  _set(key, value) {
    const next = { ...this._config };
    if (value === "" || value === null || value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    this._fire(next);
  }

  /* ── value helpers ── */
  _v(key, fallback = "") {
    return this._config[key] !== undefined ? this._config[key] : fallback;
  }

  /* ── render ── */
  _render() {
    const c = this._config;
    const isH = (c.orientation || "vertical") === "horizontal";

    /* helper: render a labeled row using CSS grid — always perfectly aligned */
    const row = (label, inputsHtml, hint = "") => `
      <div class="row">
        <span class="row-label">${label}</span>
        <div class="row-inputs">${inputsHtml}</div>
      </div>${hint ? `<div class="hint">${hint}</div>` : ""}`;

    /* helper: number input */
    const num = (id, val, { min="", max="", step="1", placeholder="" } = {}) =>
      `<input type="number" id="${id}" value="${val}" ${min!==""?"min="+min:""} ${max!==""?"max="+max:""} step="${step}" ${placeholder?`placeholder="${placeholder}"`:""}>`;

    /* helper: text input */
    const txt = (id, val, placeholder = "") =>
      `<input type="text" id="${id}" value="${this._esc(val)}" ${placeholder?`placeholder="${placeholder}"`:""}>`;

    /* helper: select */
    const sel = (id, options, current) =>
      `<select id="${id}">${options.map(([v,l]) => `<option value="${v}"${current===v?" selected":""}>${l}</option>`).join("")}</select>`;

    /* helper: color swatch + text */
    const colorRow = (id, label, def) => row(label, `
      <div class="color-wrap">
        <input type="color" id="${id}_swatch" value="${this._v(id, def)||"#e0e5ec"}">
        ${txt(id, this._v(id, def), def||"(inherit)")}
      </div>`);

    /* helper: range slider with live readout */
    const range = (id, val, min, max, step, decimals=2) =>
      `<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">
       <span class="range-val" id="${id}_val">${(+val).toFixed(decimals)}</span>`;

    /* helper: toggle checkbox */
    const toggle = (id, label, checked) =>
      `<div class="toggle"><input type="checkbox" id="${id}"${checked?" checked":""}><label for="${id}">${label}</label></div>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--primary-font-family, sans-serif); color: var(--primary-text-color, #333); }

        .editor { padding: 2px 0; display: flex; flex-direction: column; }

        /* ── section heading ── */
        .section {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--secondary-text-color, #888);
          padding: 16px 0 5px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          margin-bottom: 8px;
        }
        .section:first-child { padding-top: 2px; }

        /* ── grid row — label always 140px, inputs fill the rest ── */
        .row {
          display: grid;
          grid-template-columns: 140px 1fr;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .row-label {
          font-size: 0.76rem;
          color: var(--secondary-text-color, #666);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .row-inputs {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        /* hint sits under the row, indented to line up with inputs */
        .hint {
          font-size: 0.62rem;
          color: var(--secondary-text-color, #999);
          padding-left: 148px;
          margin-top: -4px;
          margin-bottom: 6px;
          line-height: 1.4;
        }

        /* ── inputs ── */
        input[type=text], input[type=number], select {
          flex: 1;
          min-width: 0;
          width: 100%;
          padding: 5px 7px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 6px;
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color, #333);
          font-size: 0.8rem;
          font-family: inherit;
          box-sizing: border-box;
        }
        input:focus, select:focus { outline: none; border-color: var(--primary-color, #6200ea); }

        /* number inputs in multi-input rows get a fixed width so they share evenly */
        .row-inputs input[type=number] { width: 72px; flex: none; }
        /* except lone number inputs — let those stretch */
        .row-inputs.single input[type=number] { width: 100%; flex: 1; }

        input[type=range] {
          flex: 1; min-width: 0;
          accent-color: var(--primary-color, #6200ea);
        }
        .range-val {
          font-size: 0.76rem; font-weight: 600;
          min-width: 34px; text-align: right;
          flex-shrink: 0;
          color: var(--primary-text-color, #333);
        }

        /* ── color swatch + text ── */
        .color-wrap { display: flex; align-items: center; gap: 6px; width: 100%; }
        input[type=color] {
          width: 34px; height: 28px;
          border: 1px solid var(--divider-color, #ccc); border-radius: 5px;
          padding: 1px 2px; cursor: pointer; flex-shrink: 0;
        }
        .color-wrap input[type=text] { flex: 1; }

        /* ── toggle (checkbox) ── */
        .toggle {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 7px;
        }
        .toggle input[type=checkbox] {
          width: 15px; height: 15px; flex-shrink: 0;
          accent-color: var(--primary-color, #6200ea); cursor: pointer;
        }
        .toggle label { font-size: 0.76rem; cursor: pointer; flex: 1; }

        /* ── secondary label inside row-inputs (e.g. "Max", "radius") ── */
        .lbl {
          font-size: 0.7rem; color: var(--secondary-text-color, #888);
          white-space: nowrap; flex-shrink: 0;
        }

        /* ── collapsible details ── */
        details { margin-bottom: 0; }
        details > summary {
          font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--secondary-text-color, #888);
          padding: 14px 0 5px; cursor: pointer;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
          margin-bottom: 8px; list-style: none;
          display: flex; align-items: center; gap: 6px;
        }
        details > summary::before { content: "▶"; font-size: 0.55rem; transition: transform 0.2s; }
        details[open] > summary::before { transform: rotate(90deg); }
      </style>

      <div class="editor">

        <!-- ══ ENTITY ══ -->
        <div class="section">Entity</div>
        ${row("Entity *",        txt("entity",    this._v("entity"),    "light.living_room"))}
        ${row("Attribute",       txt("attribute", this._v("attribute"), "brightness (optional)"))}
        ${row("Service",         txt("service",   this._v("service"),   "light.turn_on (optional)"))}
        ${row("Service data key",txt("service_data_key", this._v("service_data_key"), "brightness_pct"))}
        <div class="row">
          <span class="row-label">Min / Max / Step</span>
          <div class="row-inputs">
            ${num("min",  this._v("min",  0),   {step:"any"})}
            ${num("max",  this._v("max",  100), {step:"any"})}
            ${num("step", this._v("step", 1),   {step:"any", min:"0.01"})}
          </div>
        </div>

        <!-- ══ LAYOUT ══ -->
        <div class="section">Layout</div>
        ${row("Orientation", sel("orientation",
          [["vertical","Vertical"],["horizontal","Horizontal"]],
          c.orientation||"vertical"))}
        ${row("Track length",    `<div class="row-inputs single">${num("track_length", this._v("track_length", isH?"":280), {min:"40", placeholder: isH?"fills width":"280"})}</div>`)}
        <div class="row">
          <span class="row-label">Track thickness / radius</span>
          <div class="row-inputs">
            ${num("track_thickness", this._v("track_thickness",6), {min:"1",max:"40"})}
            ${num("track_radius",    this._v("track_radius",3),    {min:"0",max:"40"})}
          </div>
        </div>

        <!-- ══ LABELS ══ -->
        <div class="section">Labels &amp; Visibility</div>
        ${row("Label main",  txt("label_main",  this._v("label_main"),  "(none — primary title)"))}
        ${row("Label minor", txt("label_minor", this._v("label_minor"), "(optional subtitle)"))}
        ${row("Label position", sel("label_position",
          [["start","Start (top / left)"],["end","End (bottom / right)"]],
          c.label_position||"start"),
          "start = before the slider · end = after the slider")}
        ${row("Icon",       txt("icon", this._v("icon"), "mdi:brightness-6"))}
        ${row("Unit",       txt("unit", this._v("unit"), "%"))}
        <div class="row">
          <span class="row-label">Range labels</span>
          <div class="row-inputs">
            ${txt("label_min", this._v("label_min"), "min label")}
            ${txt("label_max", this._v("label_max"), "max label")}
          </div>
        </div>
        ${toggle("show_value",       "Show live value",          this._v("show_value",true)!==false)}
        ${toggle("show_range",       "Show min/max range labels",this._v("show_range",true)!==false)}
        ${toggle("show_border",      "Show card border/shadow",  this._v("show_border",true)!==false)}
        ${toggle("show_icon_border", "Show icon box border",     this._v("show_icon_border",true)!==false)}
        ${toggle("use_theme_colors", "Use theme colors",         this._v("use_theme_colors",false)===true)}
        ${toggle("display_only",     "Display only (no slider)", this._v("display_only",false)===true)}

        <!-- ══ FILL ══ -->
        <div class="section">Fill</div>
        ${row("Fill mode", sel("fill_mode",
          [["solid","Solid"],["none","None (empty)"],["gradient","Gradient"]],
          c.fill_mode||"solid"))}
        ${(c.fill_mode||"solid")==="gradient" ? `
        ${colorRow("fill_color_start","Gradient start","#56d3f5")}
        ${colorRow("fill_color_end",  "Gradient end",  "#e0c97f")}` : ""}
        ${row("Fill opacity", range("fill_opacity", this._v("fill_opacity",0.72), 0, 1, 0.01))}

        <!-- ══ COLORS ══ -->
        <div class="section">Colors</div>
        ${colorRow("color",            "Accent / fill",    "#e0c97f")}
        ${colorRow("background_color", "Background",       "#e0e5ec")}
        ${colorRow("text_color",       "Value text",       "#3d4f6b")}
        ${colorRow("label_color",      "Labels",           "#8a9bb2")}
        ${colorRow("icon_color",       "Icon color",       "")}

        <!-- ══ GLOW ══ -->
        <div class="section">Glow</div>
        ${toggle("glow", "Enable glow", this._v("glow",true)!==false)}
        ${row("Intensity (0–1)",
          range("glow_intensity", this._v("glow_intensity",0.55), 0, 1, 0.05),
          "Convenience scalar — sets size + opacity together. 0=off · 0.6=normal · 1=blazing")}
        ${row("Size (px)",    `<div class="row-inputs single">${num("glow_size",    this._v("glow_size",18),    {min:"0",max:"60"})}</div>`,
          "Raw spread radius — overridden when Intensity is set")}
        ${row("Opacity",      `<div class="row-inputs single">${num("glow_opacity", this._v("glow_opacity",0.55),{min:"0",max:"1",step:"0.01"})}</div>`,
          "Raw alpha — overridden when Intensity is set")}

        <!-- ══ ICON ANIMATION ══ -->
        <div class="section">Icon Animation</div>
        ${row("Animation", sel("icon_animation",
          [["none","None"],["spin","Spin"],["pulse","Pulse"],["bounce","Bounce"],
           ["shake","Shake"],["ping","Ping"],["blink","Blink"]],
          c.icon_animation||"none"),
          "Speed is proportional to slider value — paused at min, fastest at max")}
        <div class="row">
          <span class="row-label">Speed min / max (s)</span>
          <div class="row-inputs">
            ${num("icon_animation_speed_min", this._v("icon_animation_speed_min",3.0), {min:"0.1",max:"20",step:"0.1"})}
            ${num("icon_animation_speed_max", this._v("icon_animation_speed_max",0.2), {min:"0.05",max:"10",step:"0.05"})}
          </div>
        </div>

        <!-- ══ THUMB ══ -->
        <div class="section">Thumb</div>
        ${row("Shape", sel("thumb_shape",
          [["round","Round (pill)"],["squircle","Squircle"],["square","Square"]],
          c.thumb_shape||"round"))}
        ${row("Thickness (across)",
          `<div class="row-inputs single">${num("thumb_thickness", this._v("thumb_thickness", isH?24:46), {min:"4",max:"200"})}</div>`,
          isH ? "↕ controls CSS height (across the track)" : "← controls CSS width (across the track) →")}
        ${row("Length (along)",
          `<div class="row-inputs single">${num("thumb_length", this._v("thumb_length", isH?46:24), {min:"4",max:"200"})}</div>`,
          isH ? "← controls CSS width (along the track) →" : "↕ controls CSS height (along the track)")}
        ${row("Shadow size",
          `<div class="row-inputs single">${num("thumb_shadow_size", this._v("thumb_shadow_size",5), {min:"0",max:"20"})}</div>`)}

        <!-- ══ ADVANCED (collapsible) ══ -->
        <details>
          <summary>Advanced sizing, typography &amp; overrides</summary>

          <div class="section" style="padding-top:8px">Card Shell</div>
          <div class="row">
            <span class="row-label">Radius / Shadow</span>
            <div class="row-inputs">
              ${num("card_radius",      this._v("card_radius",22),     {min:"0",max:"60"})}
              ${num("card_shadow_size", this._v("card_shadow_size",7),  {min:"0",max:"30"})}
            </div>
          </div>
          ${row("Padding", txt("card_padding", this._v("card_padding", isH?"20px 24px 18px":"24px 20px 20px")))}

          <div class="section">Icon Box</div>
          <div class="row">
            <span class="row-label">Size / Box radius / Glyph</span>
            <div class="row-inputs">
              ${num("icon_size",       this._v("icon_size",       isH?38:46), {min:"20",max:"100"})}
              ${num("icon_box_radius", this._v("icon_box_radius", isH?11:13), {min:"0", max:"50"})}
              ${num("icon_mdi_size",   this._v("icon_mdi_size",   isH?20:22), {min:"10",max:"60"})}
            </div>
          </div>

          <div class="section">Spacing</div>
          <div class="row">
            <span class="row-label">Header gap / margin</span>
            <div class="row-inputs">
              ${num("header_gap",    this._v("header_gap",    isH?10:6),  {min:"0",max:"40"})}
              ${num("header_margin", this._v("header_margin", isH?16:18), {min:"0",max:"80"})}
            </div>
          </div>
          ${row("Footer margin",
            `<div class="row-inputs single">${num("footer_margin", this._v("footer_margin", isH?10:14), {min:"0",max:"60"})}</div>`)}

          <div class="section">Typography</div>
          <div class="row">
            <span class="row-label">Font name / value / range</span>
            <div class="row-inputs">
              ${txt("font_name",  this._v("font_name",  "0.76rem"))}
              ${txt("font_value", this._v("font_value", "1.05rem"))}
              ${txt("font_range", this._v("font_range", "0.68rem"))}
            </div>
          </div>
          ${row("Font minor label", txt("font_minor", this._v("font_minor", "0.65rem")),
            "Font size for the minor/subtitle label")}
          ${row("Font display value", txt("font_display", this._v("font_display", "2.4rem")),
            "Font size for the large value in display_only mode")}

          <div class="section">Grip Lines</div>
          <div class="row">
            <span class="row-label">Lines / width / height / gap</span>
            <div class="row-inputs">
              ${num("grip_lines",  this._v("grip_lines",  3),   {min:"0",max:"10"})}
              ${num("grip_width",  this._v("grip_width",  isH?12:18), {min:"1",max:"60"})}
              ${num("grip_height", this._v("grip_height", 2),   {min:"1",max:"10"})}
              ${num("grip_gap",    this._v("grip_gap",    3.5), {min:"0",max:"20",step:"0.5"})}
            </div>
          </div>

          <div class="section">Shadows</div>
          ${row("Shadow dark",  txt("shadow_dark",  this._v("shadow_dark",  "rgba(163,177,198,0.6)")))}
          ${row("Shadow light", txt("shadow_light", this._v("shadow_light", "rgba(255,255,255,0.9)")))}

          <div class="section">Thumb Low-level Overrides</div>
          <div class="row">
            <span class="row-label">Explicit radius</span>
            <div class="row-inputs single">
              ${num("thumb_radius", this._v("thumb_radius",""), {min:"0",max:"100",placeholder:"auto from shape"})}
            </div>
          </div>
          <div class="hint">Explicit CSS border-radius — overrides thumb_shape preset</div>
          <div class="row">
            <span class="row-label">CSS width / height</span>
            <div class="row-inputs">
              ${num("thumb_width",  this._v("thumb_width",""),  {min:"4",max:"300",placeholder:"auto"})}
              ${num("thumb_height", this._v("thumb_height",""), {min:"4",max:"300",placeholder:"auto"})}
            </div>
          </div>
          <div class="hint">Bypass axis mapping entirely — use only when axis names are insufficient</div>

        </details>
      </div>
    `;

    this._attachEditorEvents();
  }

  _esc(v) {
    return (v ?? "").toString().replace(/"/g, "&quot;");
  }

  _attachEditorEvents() {
    const root = this.shadowRoot;

    /* ── text / number inputs ── */
    const textIds = [
      "entity","attribute","service","service_data_key",
      "label_main","label_minor","icon","unit","label_min","label_max",
      "min","max","step",
      "track_length","track_thickness","track_radius",
      "thumb_thickness","thumb_length","thumb_shadow_size",
      "thumb_radius","thumb_width","thumb_height",
      "card_radius","card_shadow_size","card_padding",
      "icon_size","icon_box_radius","icon_mdi_size",
      "header_gap","header_margin","footer_margin",
      "font_name","font_value","font_range","font_minor","font_display",
      "grip_lines","grip_width","grip_height","grip_gap",
      "shadow_dark","shadow_light",
      "glow_size","glow_opacity",
      "icon_animation_speed_min","icon_animation_speed_max",
    ];
    textIds.forEach(id => {
      const el = root.getElementById(id);
      if (!el) return;
      const handler = () => {
        let val = el.value.trim();
        if (el.type === "number") {
          val = val === "" ? undefined : parseFloat(val);
        } else if (val === "") {
          val = undefined;
        }
        this._set(id, val);
      };
      el.addEventListener("change", handler);
      el.addEventListener("keydown", e => { if (e.key === "Enter") handler(); });
    });

    /* ── select dropdowns ── */
    ["orientation","fill_mode","thumb_shape","icon_animation","label_position"].forEach(id => {
      const el = root.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => this._set(id, el.value));
    });

    /* ── checkboxes ── */
    ["glow","show_value","show_range","show_border","show_icon_border","use_theme_colors","display_only"].forEach(id => {
      const el = root.getElementById(id);
      if (!el) return;
      el.addEventListener("change", () => this._set(id, el.checked));
    });

    /* ── range sliders ── */
    [
      ["fill_opacity",   "fill_opacity",   2],
      ["glow_intensity", "glow_intensity", 2],
    ].forEach(([id, key, dec]) => {
      const el  = root.getElementById(id);
      const out = root.getElementById(id + "_val");
      if (!el) return;
      el.addEventListener("input", () => {
        const v = parseFloat(el.value);
        if (out) out.textContent = v.toFixed(dec);
        this._set(key, v);
      });
    });

    /* ── color pickers — swatch ID is now "<key>_swatch", text is "<key>" ── */
    [
      "color","background_color","text_color","label_color","icon_color",
      "fill_color_start","fill_color_end",
    ].forEach(key => {
      const swatch = root.getElementById(key + "_swatch");
      const txt    = root.getElementById(key);
      if (swatch) {
        swatch.addEventListener("input", () => {
          if (txt) txt.value = swatch.value;
          this._set(key, swatch.value);
        });
      }
      if (txt) {
        txt.addEventListener("change", () => {
          const v = txt.value.trim();
          if (v && swatch) swatch.value = v;
          this._set(key, v || undefined);
        });
      }
    });
  }
}

customElements.define("neumorphic-slider-card-editor", NeumorphicSliderCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type:             "neumorphic-slider-card",
  name:             "Neumorphic Slider Card",
  description:      "Vertical / horizontal neumorphic slider — parametric sizing, glow, gradient fill, icon animation.",
  preview:          true,
  documentationURL: "https://github.com/",
});
