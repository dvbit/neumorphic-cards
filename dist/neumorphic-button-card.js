/**
 * Neumorphic Button Card for Home Assistant  — v15
 * Matches the hacs-neumorphic-template theme aesthetic
 *
 * ── Core options ─────────────────────────────────────────────────────────────
 * type:            custom:neumorphic-button-card
 * entity:          light.my_light
 * icon:            mdi:lightbulb
 * card_mode:       default          # default | flat | none
 *   default  → full neumorphic card with raised shadow and background
 *   flat     → shadow removed, background transparent, padding reduced (8px)
 *              Knob is still contained - labels/dot stay spaced. Use inside grid cards.
 *   none     → zero padding, zero radius, no background, no shadow - card is invisible.
 *              Only the knob + labels render. Flat vs none: flat keeps 8px padding and
 *              border-radius; none strips everything to zero.
 *
 * icon_on_color:   '#e8824a'        # icon + glow color when entity is ON
 *
 * label_major / label_minor font options include:
 *   font_family: 'Roboto'            # any CSS font name or Google Font; blank = theme default
 *   font_size, font_weight, font_style, letter_spacing, text_transform — see label docs
 * icon_off_color:  ''               # icon color when OFF (default: grey #a0a0a8)
 * show_dot:        true             # false to hide the state indicator dot
 *
 * display_only:    false            # true = read-only display card
 *   When true: the knob and icon remain as a visual state indicator (on/off glow,
 *   animations etc.) but ALL pointer events, tap/hold actions and ripple are
 *   disabled. The card cannot change the entity value. Use to observe state
 *   without accidental interaction — e.g. a sensor or a status indicator.
 * icon_animation:  pulse            # pulse|spin|bounce|swing|flash|none
 * size:            68               # knob diameter px
 * icon_size:       28               # icon px (auto if omitted)
 * shape:           round            # round|squircle|square
 * glow_intensity:  1                # 0–2
 * depth:           1                # 0–2
 *
 * tap_action:      toggle           # toggle|more-info|call-service
 * hold_action:     more-info        # toggle|more-info|call-service|none (fires after hold_timeout ms)
 * hold_timeout:    500              # ms before hold fires (default 500)
 * service:         light.turn_on    # service for tap_action: call-service
 * service_data:    {}
 * hold_service:    scene.turn_on    # service for hold_action: call-service
 * hold_service_data: {}
 *
 * ── Label system ─────────────────────────────────────────────────────────────
 * label_major / label_minor — see inline docs below
 */

// ═══════════════════════════════════════════════════════════════════════════════
//  CARD
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_ON_COLOR = '#e8824a';

const POWER_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18.36 6.64A9 9 0 1 1 5.64 6.64"/>
  <line x1="12" y1="2" x2="12" y2="12"/>
</svg>`;

const MDI_PATHS = {
  'mdi:lightbulb':     'M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7m0 18a1 1 0 0 1 1 1H11a1 1 0 0 1 1-1m3-3H9v1h6v-1z',
  'mdi:power':         'M16.56 5.44l-1.45 1.45A5.969 5.969 0 0 1 18 12a6 6 0 0 1-6 6 6 6 0 0 1-6-6c0-2.17 1.16-4.06 2.89-5.11L7.44 5.44A7.961 7.961 0 0 0 4 12a8 8 0 0 0 8 8 8 8 0 0 0 8-8c0-2.72-1.36-5.12-3.44-6.56M13 3h-2v10h2V3z',
  'mdi:toggle-switch': 'M17 6H7c-3.31 0-6 2.69-6 6s2.69 6 6 6h10c3.31 0 6-2.69 6-6s-2.69-6-6-6zm0 10H7c-2.21 0-4-1.79-4-4s1.79-4 4-4h10c2.21 0 4 1.79 4 4s-1.79 4-4 4zm0-7a3 3 0 1 0 .001 6.001A3 3 0 0 0 17 9z',
  'mdi:fan':           'M12 11A1 1 0 0 0 11 12 1 1 0 0 0 12 13 1 1 0 0 0 13 12 1 1 0 0 0 12 11M12.5 2C17 2 17.11 5.57 14.75 6.75 13.28 7.5 13 8.31 13 9H11C11 7.56 11.44 6.25 12.5 5.25 13.5 4.25 14 3.13 13.13 2.25 12.38 1.5 10.59 1.47 10.13 3.13L8.17 2.61C8.68 .5 10.43 2 12.5 2M2 12.5C2 8 5.57 7.89 6.75 10.25 7.5 11.72 8.31 12 9 12V14C7.56 14 6.25 13.56 5.25 12.5 4.25 11.5 3.13 11 2.25 11.88 1.5 12.63 1.47 14.41 3.13 14.87L2.61 16.83C.5 16.32 2 14.57 2 12.5M12 21.5C7.5 21.5 7.5 17.93 9.25 16.75 10.72 15.5 11 15.69 11 15H13C13 16.44 12.56 17.75 11.5 18.75 10.5 19.75 10 20.88 10.88 21.75 11.63 22.5 13.41 22.53 13.87 20.88L15.83 21.4C15.32 23.5 13.57 21.5 12 21.5M21.5 11.5C22 16 18.43 16.11 17.25 13.75 16.5 12.28 15.69 12 15 12V10C16.44 10 17.75 10.44 18.75 11.5 19.75 12.5 20.88 13 21.75 12.13 22.5 11.38 22.53 9.59 20.88 9.13L21.4 7.17C23.5 7.68 21.5 9.43 21.5 11.5Z',
  'mdi:thermometer':   'M15 13V5A3 3 0 0 0 9 5V13A5 5 0 1 0 15 13M12 4A1 1 0 0 1 13 5V8H11V5A1 1 0 0 1 12 4Z',
  'mdi:microphone':    'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V5a3 3 0 0 1 3-3m7 9c0 3.53-2.61 6.44-6 6.93V21h-2v-3.07c-3.39-.49-6-3.4-6-6.93h2a5 5 0 0 0 5 5 5 5 0 0 0 5-5h2z',
  'mdi:television':    'M21 17H3V5h18m0-2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
  'mdi:speaker':       'M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.84-5 6.7v2.07C18.01 19.86 21 16.28 21 12c0-4.27-2.99-7.85-7-8.77M16.5 12c0-1.77-1-3.29-2.5-4.03V16c1.5-.71 2.5-2.24 2.5-4M3 9v6h4l5 5V4L7 9H3z',
  'mdi:lock':          'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
};

function getMdiPath(icon) { return MDI_PATHS[icon] ?? null; }
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function resolveShape(shape, knobSize) {
  const p = (pct) => `${Math.round(knobSize * pct)}px`;
  switch ((shape ?? 'round').toLowerCase()) {
    case 'squircle': return { knob: p(0.28), card: p(0.22) };
    case 'square':   return { knob: p(0.14), card: p(0.11) };
    default:         return { knob: '50%',   card: null };
  }
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${clamp(alpha,0,1).toFixed(3)})`;
}

function buildKnobShadow({ r, di, gi, onColor, isOn, sd, sl }) {
  const layers = [];
  if (di > 0) {
    const od = r(Math.round(5+7*di)), ob = r(Math.round(12+16*di)), oa = clamp(0.25+0.35*di,0,1);
    layers.push(`${od}px ${od}px ${ob}px rgba(160,162,170,${oa.toFixed(3)})`);
    layers.push(`-${od}px -${od}px ${ob}px rgba(255,255,255,${clamp(0.55+0.35*di,0,1).toFixed(3)})`);
    const er = r(Math.round(1+1*di)), eb = r(Math.round(3+3*di)), ea = clamp(0.12+0.12*di,0,1);
    layers.push(`0px 0px ${eb}px ${er}px rgba(140,142,150,${ea.toFixed(3)})`);
  } else {
    layers.push(`${r(5)}px ${r(5)}px ${r(12)}px ${sd}`);
    layers.push(`-${r(5)}px -${r(5)}px ${r(12)}px ${sl}`);
  }
  if (isOn && di > 0) {
    const id = r(Math.round(2+3*di)), ib = r(Math.round(4+6*di));
    layers.push(`inset ${id}px ${id}px ${ib}px rgba(140,142,150,${clamp(0.18+0.22*di,0,0.6).toFixed(3)})`);
    layers.push(`inset -${id}px -${id}px ${ib}px rgba(255,255,255,${clamp(0.50+0.30*di,0,1).toFixed(3)})`);
  } else if (isOn && di === 0) {
    layers.push(`inset ${r(2)}px ${r(2)}px ${r(5)}px ${sd}`);
    layers.push(`inset -${r(2)}px -${r(2)}px ${r(5)}px ${sl}`);
  }
  if (isOn && gi > 0) {
    layers.push(`0 0 ${r(10)}px ${r(-2)}px ${hexToRgba(onColor,gi*0.85)}`);
    layers.push(`0 0 ${r(26)}px ${r(-4)}px ${hexToRgba(onColor,gi*0.45)}`);
  }
  return layers.join(',\n      ');
}

const MAJOR_DEFAULTS = {
  visible: true, position: 'bottom', font_size: 13, font_weight: 600,
  font_family: '', font_style: 'normal', letter_spacing: 0.04, text_transform: 'none',
  color: '', opacity: 0.85, align: 'center', max_width: 0, truncate: true,
};
const MINOR_DEFAULTS = {
  visible: true, font_size: 10, font_weight: 400, font_family: '',
  font_style: 'normal', letter_spacing: 0.07, text_transform: 'uppercase', color: '', opacity: 0.50,
  align: 'center', max_width: 0, truncate: true,
};

function resolveLabel(userCfg, defaults) {
  if (!userCfg && userCfg !== false) return { ...defaults };
  if (userCfg === false) return { ...defaults, visible: false };
  return { ...defaults, ...userCfg };
}

function positionLayout(pos) {
  switch ((pos ?? 'bottom').toLowerCase()) {
    case 'top':   return { flex: 'column-reverse', labelAlign: 'center',      side: 'top' };
    case 'left':  return { flex: 'row-reverse',    labelAlign: 'flex-end',    side: 'left' };
    case 'right': return { flex: 'row',            labelAlign: 'flex-start',  side: 'right' };
    default:      return { flex: 'column',         labelAlign: 'center',      side: 'bottom' };
  }
}

function labelCSS(cls, cfg, isHorizontal) {
  const mw  = cfg.max_width > 0 ? `${cfg.max_width}px` : (isHorizontal ? '160px' : '100%');
  const col = cfg.color ? cfg.color : 'var(--primary-text-color, #4a4f5a)';
  return `
  .${cls} {
    font-family:    ${cfg.font_family ? '"' + cfg.font_family + '"' : 'var(--primary-font-family, var(--paper-font-body1_-_font-family, inherit))'};
    font-size:      ${cfg.font_size}px;
    font-weight:    ${cfg.font_weight};
    font-style:     ${cfg.font_style};
    letter-spacing: ${cfg.letter_spacing}em;
    text-transform: ${cfg.text_transform};
    color:          ${col};
    opacity:        ${cfg.opacity};
    text-align:     ${cfg.align};
    max-width:      ${mw};
    overflow:       ${cfg.truncate ? 'hidden' : 'visible'};
    white-space:    ${cfg.truncate ? 'nowrap' : 'normal'};
    text-overflow:  ${cfg.truncate ? 'ellipsis' : 'clip'};
    line-height:    1.3;
    transition:     opacity 0.2s ease, color 0.2s ease;
    flex-shrink:    0;
  }`;
}

// Build @import rules for any Google Fonts needed — injected into shadow root style
function buildFontImports(majorCfg, minorCfg) {
  const WEB_SAFE = new Set([
    '', 'system-ui', 'Arial', 'Helvetica Neue', 'Georgia',
    'Times New Roman', 'Courier New', 'monospace', 'serif', 'sans-serif'
  ]);
  const families = [majorCfg.font_family, minorCfg.font_family]
    .filter(f => f && !WEB_SAFE.has(f));
  const unique = [...new Set(families)];
  if (!unique.length) return '';
  return unique.map(f =>
    `@import url('https://fonts.googleapis.com/css2?family=${
      encodeURIComponent(f).replace(/%20/g,'+')
    }:wght@300;400;500;600;700;800&display=swap');`
  ).join('\n');
}

function buildStyles(knobSize, iconSize, shape, glowIntensity, depth, onColor, offColor, majorCfg, minorCfg) {
  const k  = knobSize / 68;
  const r  = (v) => Math.round(v * k);
  const f  = (v) => +(v * k).toFixed(2);
  const gi = clamp(glowIntensity, 0, 3);
  const di = clamp(depth, 0, 2);
  const sd = 'var(--nm-shadow-dark)', sl = 'var(--nm-shadow-lite)';

  const sh2d = r(Math.round(5+4*di)), sh2b = r(Math.round(12+8*di));
  const shPd = r(2), shPb = r(6);

  const { knob: knobRadius, card: cardRadius } = resolveShape(shape, knobSize);
  const cardRadiusRule = cardRadius ?? `var(--ha-card-border-radius, ${r(18)}px)`;

  const iconDropBlur  = gi > 0 ? `${+(r(4)*gi).toFixed(1)}px` : '0px';
  const iconDropColor = gi > 0 ? hexToRgba(onColor, gi*0.9) : 'transparent';
  const dotGlowColor  = gi > 0 ? hexToRgba(onColor, gi*0.9) : 'transparent';

  const shadowOff     = buildKnobShadow({ r, di, gi:0, onColor, isOn:false, sd, sl });
  const shadowOn      = buildKnobShadow({ r, di, gi,   onColor, isOn:true,  sd, sl });
  const shadowPressed = `inset ${r(2)}px ${r(2)}px ${r(6)}px ${sd}, inset -${r(2)}px -${r(2)}px ${r(6)}px ${sl}`;

  const dotSz = Math.max(4, r(6)), dotMT = -Math.max(3, r(6)), bY = r(6);
  const shineOpacity = clamp(di*0.18, 0, 0.35).toFixed(3);
  const knobBg = di > 0
    ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,${shineOpacity}) 0%, transparent 68%), var(--nm-bg)`
    : 'var(--nm-bg)';

  const pos      = majorCfg.position ?? 'bottom';
  const { flex: cardFlex, labelAlign, side } = positionLayout(pos);
  const isHoriz  = side === 'left' || side === 'right';
  const padV = r(isHoriz ? 14 : 20), padH = r(14), padB = r(isHoriz ? 14 : 16);
  const gap  = r(isHoriz ? 14 : 10);
  const fpV  = r(8), fpH = r(10), fpB = r(6);

  const lblTextAlign = isHoriz ? (side === 'left' ? 'right' : 'left') : 'center';
  const majorAlign = majorCfg.align !== 'center' ? majorCfg.align : (isHoriz ? lblTextAlign : 'center');
  const minorAlign = minorCfg.align !== 'center' ? minorCfg.align : (isHoriz ? lblTextAlign : 'center');
  const majorCSS_ = labelCSS('lbl-major', { ...majorCfg, align: majorAlign }, isHoriz);
  const minorCSS_ = labelCSS('lbl-minor', { ...minorCfg, align: minorAlign }, isHoriz);

  const fontImports = buildFontImports(majorCfg, minorCfg);
  return `${fontImports ? fontImports + '\n' : ''}
  :host { display: block; }
  .card-wrapper {
    --nm-bg:          var(--ha-card-background, #e0e5ec);
    --nm-shadow-dark: var(--neumorphic-shadow-dark,  #b8bec7);
    --nm-shadow-lite: var(--neumorphic-shadow-light, #ffffff);
    --nm-on-color:    ${onColor};
    --nm-off-color:   var(--nm-icon-off, #a0a0a8);
    --nm-icon-off:    ${offColor || '#a0a0a8'};
    --nm-text:        var(--primary-text-color, #4a4f5a);
    display: flex; flex-direction: ${cardFlex}; align-items: center; justify-content: center;
    padding: ${padV}px ${padH}px ${padB}px; gap: ${gap}px;
    background: var(--nm-bg); border-radius: ${cardRadiusRule};
    box-shadow: ${sh2d}px ${sh2d}px ${sh2b}px var(--nm-shadow-dark), -${sh2d}px -${sh2d}px ${sh2b}px var(--nm-shadow-lite);
    cursor: pointer; user-select: none; -webkit-tap-highlight-color: transparent;
    transition: box-shadow 0.18s ease; position: relative; overflow: hidden;
  }
  .card-wrapper.mode-flat { box-shadow: none; background: transparent; padding: var(--nm-flat-pad, 8px) var(--nm-flat-padh, 10px) var(--nm-flat-padb, 6px); }px ${fpH}px ${fpB}px; }
  .card-wrapper.mode-none { box-shadow: none !important; background: transparent !important; border-radius: 0 !important; padding: 0 !important; }
  .card-wrapper.pressed:not(.mode-flat):not(.mode-none) {
    box-shadow: ${shPd}px ${shPd}px ${shPb}px var(--nm-shadow-dark), -${shPd}px -${shPd}px ${shPb}px var(--nm-shadow-lite),
      inset ${shPd}px ${shPd}px ${r(8)}px var(--nm-shadow-dark), inset -${shPd}px -${shPd}px ${r(8)}px var(--nm-shadow-lite);
  }
  .knob {
    width: ${knobSize}px; height: ${knobSize}px; border-radius: ${knobRadius};
    background: ${knobBg}; display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: box-shadow 0.22s ease, transform 0.14s ease;
    box-shadow: ${shadowOff};
  }
  .knob.on  { box-shadow: ${shadowOn}; }
  .card-wrapper.pressed .knob { transform: scale(0.95); box-shadow: ${shadowPressed}; }
  .icon-wrap { width: ${iconSize}px; height: ${iconSize}px; display: flex; align-items: center; justify-content: center; }
  .icon-wrap svg, .icon-wrap ha-icon { width: ${iconSize}px; height: ${iconSize}px; display: block; transition: color 0.25s ease, filter 0.25s ease; }
  .knob.off .icon-wrap { color: var(--nm-off-color); filter: none; }
  .knob.on  .icon-wrap { color: var(--nm-on-color); filter: ${gi > 0 ? `drop-shadow(0 0 ${iconDropBlur} ${iconDropColor})` : 'none'}; }
  .knob.on[data-anim="pulse"] .icon-wrap  { animation: nm-pulse  1.8s ease-in-out infinite; }
  @keyframes nm-pulse  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.25)} }
  .knob.on[data-anim="spin"] .icon-wrap   { animation: nm-spin   1.4s linear infinite; }
  @keyframes nm-spin   { to{transform:rotate(360deg)} }
  .knob.on[data-anim="bounce"] .icon-wrap { animation: nm-bounce 1s cubic-bezier(.36,.07,.19,.97) infinite; }
  @keyframes nm-bounce { 0%,100%{transform:translateY(0)} 30%{transform:translateY(-${bY}px)} 60%{transform:translateY(-${Math.round(bY*0.33)}px)} }
  .knob.on[data-anim="swing"] .icon-wrap  { transform-origin:top center; animation: nm-swing 1.3s ease-in-out infinite; }
  @keyframes nm-swing { 0%,100%{transform:rotate(0)} 20%{transform:rotate(18deg)} 50%{transform:rotate(-14deg)} 75%{transform:rotate(8deg)} 90%{transform:rotate(-4deg)} }
  .knob.on[data-anim="flash"] .icon-wrap  { animation: nm-flash  1.2s ease-in-out infinite; }
  @keyframes nm-flash { 0%,100%{opacity:1} 50%{opacity:.15} }
  .label-block { display: flex; flex-direction: column; align-items: ${labelAlign}; justify-content: ${isHoriz ? 'center' : 'flex-start'}; gap: ${r(3)}px; flex-shrink: 1; min-width: 0; }
  ${majorCSS_}
  ${minorCSS_}
  .card-wrapper:not(.pressed):hover .lbl-major,
  .card-wrapper:not(.pressed):hover .lbl-minor { opacity: 1; }
  .state-dot {
    width: ${dotSz}px; height: ${dotSz}px; border-radius: 50%;
    background: var(--nm-off-color); transition: background 0.25s ease, box-shadow 0.25s ease;
    flex-shrink: 0; ${isHoriz ? '' : `margin-top: ${dotMT}px;`}
  }
  .state-dot.on { background: var(--nm-on-color); box-shadow: ${gi > 0 ? `0 0 ${r(6)}px 1px ${dotGlowColor}` : 'none'}; }
  .state-dot.hidden { display: none !important; }
  .ripple { position: absolute; border-radius: 50%; transform: scale(0); animation: nm-ripple 0.5s linear; background: rgba(255,255,255,0.25); pointer-events: none; }
  @keyframes nm-ripple { to { transform: scale(4); opacity: 0; } }
  .hold-ring { position: absolute; border-radius: inherit; inset: 0; border: 3px solid var(--nm-on-color); opacity: 0; pointer-events: none; transform: scale(0.75); }
  .hold-ring.charging { animation: nm-hold-ring var(--nm-hold-timeout, 500ms) linear forwards; }
  @keyframes nm-hold-ring { 0%{transform:scale(0.75);opacity:0.15} 80%{transform:scale(1.05);opacity:0.7} 100%{transform:scale(1.12);opacity:0} }
  /* ── display-only mode: visual only, no interaction ── */
  .card-wrapper.mode-display {
    cursor: default !important;
    pointer-events: none !important;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
`;
}

class NeumorphicButtonCard extends HTMLElement {
  constructor() {
    super();
    this._hass = null; this._config = null;
    this._shadow = this.attachShadow({ mode: 'open' });
    this._wrapper = null; this._knob = null;
    this._lblMajor = null; this._lblMinor = null; this._dot = null;
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Please define an entity.');
    const knobSize      = Number(config.size ?? 68);
    const iconSize      = Number(config.icon_size ?? Math.round(knobSize * 0.412));
    const glowIntensity = Number(config.glow_intensity ?? 1);
    const depth         = Number(config.depth ?? 1);
    const onColor       = config.icon_on_color ?? DEFAULT_ON_COLOR;
    const offColor      = config.icon_off_color  || '';
    const majorCfg      = resolveLabel(config.label_major, MAJOR_DEFAULTS);
    const minorCfg      = resolveLabel(config.label_minor, MINOR_DEFAULTS);
    minorCfg.position   = majorCfg.position;
    this._config = {
      tap_action: 'toggle', hold_action: 'none', hold_timeout: 500, hold_service: '', hold_service_data: {},
      card_mode: 'default', icon_animation: 'none', shape: 'round', display_only: false,
      ...config, _knobSize: knobSize, _iconSize: iconSize,
      _glowIntensity: glowIntensity, _depth: depth, _onColor: onColor, _offColor: offColor,
      _majorCfg: majorCfg, _minorCfg: minorCfg,
    };
    this._render();
  }

  set hass(hass) { this._hass = hass; this._updateState(); }

  _render() {
    const cfg = this._config, major = cfg._majorCfg, minor = cfg._minorCfg;
    const style = document.createElement('style');
    style.textContent = buildStyles(cfg._knobSize, cfg._iconSize, cfg.shape, cfg._glowIntensity, cfg._depth, cfg._onColor, cfg._offColor, major, minor);

    const cardMode = (cfg.card_mode || 'default').toLowerCase();
    const displayOnly = cfg.display_only === true;

    const wrapper = document.createElement('div');
    wrapper.className = 'card-wrapper' +
      (displayOnly ? ' mode-display' : (cardMode !== 'default' ? ` mode-${cardMode}` : ''));

    // display_only shares the same DOM as normal mode — pointer-events: none
    // is applied via .mode-display CSS; no separate branch needed.
    this._displayValueEl = null;

    const knob = document.createElement('div');
    knob.className = 'knob off';
    if (cfg.icon_animation && cfg.icon_animation !== 'none') knob.dataset.anim = cfg.icon_animation;
    const iconWrap = document.createElement('div');
    iconWrap.className = 'icon-wrap';
    iconWrap.innerHTML = this._buildIconSVG(cfg.icon, cfg._iconSize);
    knob.appendChild(iconWrap);
    // hold ring overlay
    const holdRing = document.createElement('div');
    holdRing.className = 'hold-ring';
    wrapper.style.setProperty('--nm-hold-timeout', (cfg.hold_timeout || 500) + 'ms');
    wrapper.appendChild(holdRing);

    const hasAnyLabel = major.visible || minor.visible;
    let lblBlock = null, lblMajorEl = null, lblMinorEl = null;
    if (hasAnyLabel) {
      lblBlock = document.createElement('div');
      lblBlock.className = 'label-block';
      if (major.visible) {
        lblMajorEl = document.createElement('div');
        lblMajorEl.className = 'lbl-major';
        lblMajorEl.textContent = major.text ?? cfg.name ?? cfg.entity.split('.').pop()?.replace(/_/g,' ') ?? '';
        lblBlock.appendChild(lblMajorEl);
      }
      if (minor.visible) {
        lblMinorEl = document.createElement('div');
        lblMinorEl.className = 'lbl-minor';
        lblMinorEl.textContent = minor.text ?? '';
        lblBlock.appendChild(lblMinorEl);
      }
    }

    const dot = document.createElement('div');
    const showDot = cfg.show_dot !== false;
    dot.className = 'state-dot' + (showDot ? '' : ' hidden');
    const pos = major.position ?? 'bottom';
    const isHoriz = pos === 'left' || pos === 'right';

    if (isHoriz) {
      const dotWrap = document.createElement('div');
      dotWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
      dotWrap.appendChild(knob); dotWrap.appendChild(dot);
      wrapper.appendChild(dotWrap);
      if (lblBlock) wrapper.appendChild(lblBlock);
    } else {
      wrapper.appendChild(knob);
      if (lblBlock) wrapper.appendChild(lblBlock);
      wrapper.appendChild(dot);
    }

    // ── Tap + Hold event handling ─────────────────────────────────────────
    let _holdTimer = null;
    let _didHold   = false;

    wrapper.addEventListener('pointerdown', (e) => {
      wrapper.classList.add('pressed');
      this._spawnRipple(e, wrapper);
      _didHold = false;
      if (this._config.hold_action && this._config.hold_action !== 'none') {
        holdRing.classList.remove('charging');
        void holdRing.offsetWidth;
        holdRing.classList.add('charging');
        _holdTimer = setTimeout(() => {
          _didHold = true;
          holdRing.classList.remove('charging');
          this._handleHoldAction();
        }, this._config.hold_timeout || 500);
      }
    });
    const _cancelHold = () => {
      if (_holdTimer) { clearTimeout(_holdTimer); _holdTimer = null; }
      holdRing.classList.remove('charging');
      wrapper.classList.remove('pressed');
    };
    wrapper.addEventListener('pointerup',    _cancelHold);
    wrapper.addEventListener('pointerleave', _cancelHold);
    wrapper.addEventListener('click', () => { if (!_didHold) this._handleAction(); _didHold = false; });

    this._shadow.innerHTML = '';
    this._shadow.appendChild(style);
    this._shadow.appendChild(wrapper);
    this._wrapper = wrapper; this._knob = knob;
    this._lblMajor = lblMajorEl; this._lblMinor = lblMinorEl; this._dot = dot;
  }

  _buildIconSVG(icon, iconSize) {
    if (!icon) return POWER_SVG;
    const path = getMdiPath(icon);
    if (path) return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${path}"/></svg>`;
    return `<ha-icon icon="${icon}" style="--mdc-icon-size:${iconSize}px;color:currentColor;"></ha-icon>`;
  }

  _updateState() {
    if (!this._hass || !this._config) return;
    const entity = this._hass.states[this._config.entity];
    if (!entity) return;

    // display_only: state still updates knob on/off visually; no special branch needed
    if (!this._knob || !this._dot) return;
    const OFF = new Set(['off','unavailable','unknown','idle','paused','away','closed','locked','standby']);
    const ON  = new Set(['on','playing','home','open','unlocked']);
    const isOn = ON.has(entity.state) || !OFF.has(entity.state);
    this._knob.className = `knob ${isOn ? 'on' : 'off'}`;
    if (this._config.icon_animation && this._config.icon_animation !== 'none') this._knob.dataset.anim = this._config.icon_animation;
    const _showDot = this._config.show_dot !== false;
    this._dot.className = `state-dot${isOn ? ' on' : ''}${_showDot ? '' : ' hidden'}`;
    const major = this._config._majorCfg;
    if (this._lblMajor && !major.text && !this._config.name) {
      this._lblMajor.textContent = entity.attributes.friendly_name ?? this._config.entity.split('.').pop()?.replace(/_/g,' ') ?? '';
    }
  }

  _spawnRipple(e, wrapper) {
    const rect = wrapper.getBoundingClientRect(), size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    Object.assign(ripple.style, { width:`${size}px`, height:`${size}px`, left:`${e.clientX-rect.left-size/2}px`, top:`${e.clientY-rect.top-size/2}px` });
    wrapper.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  _handleAction() {
    if (!this._hass || !this._config) return;
    const cfg = this._config;
    switch (cfg.tap_action) {
      case 'toggle': this._hass.callService('homeassistant','toggle',{entity_id:cfg.entity}); break;
      case 'more-info': this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:cfg.entity}})); break;
      case 'call-service': { const [d,s]=(cfg.service??'').split('.'); if(d&&s) this._hass.callService(d,s,{entity_id:cfg.entity,...(cfg.service_data??{})}); break; }
    }
  }

  _handleHoldAction() {
    if (!this._hass || !this._config) return;
    const cfg = this._config;
    switch (cfg.hold_action) {
      case 'toggle': this._hass.callService('homeassistant','toggle',{entity_id:cfg.entity}); break;
      case 'more-info': this.dispatchEvent(new CustomEvent('hass-more-info',{bubbles:true,composed:true,detail:{entityId:cfg.entity}})); break;
      case 'call-service': {
        const [d,s]=(cfg.hold_service??'').split('.');
        if(d&&s) this._hass.callService(d,s,{entity_id:cfg.entity,...(cfg.hold_service_data??{})});
        break;
      }
    }
  }

  getCardSize() { const s = this._config?._knobSize ?? 68; return s >= 100 ? 3 : s <= 48 ? 1 : 2; }

  static getStubConfig() {
    return {
      entity:'light.example', icon:'mdi:lightbulb', icon_on_color:DEFAULT_ON_COLOR,
      shape:'round', depth:1, glow_intensity:1, tap_action:'toggle',
      label_major:{ text:'Living Room', visible:true, position:'bottom', font_size:13, font_weight:600, text_transform:'none', opacity:0.85 },
      label_minor:{ text:'Ceiling light', visible:true, font_size:10, text_transform:'uppercase', letter_spacing:0.08, opacity:0.50 },
    };
  }
}

customElements.define('neumorphic-button-card', NeumorphicButtonCard);


// ═══════════════════════════════════════════════════════════════════════════════
//  VISUAL EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const EDITOR_STYLES = `
  :host { display: block; font-family: var(--paper-font-body1_-_font-family, sans-serif); }

  /* ── section headers ── */
  .section-header {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--secondary-text-color, #8891a0);
    padding: 16px 0 6px; border-bottom: 1px solid var(--divider-color, rgba(0,0,0,.08));
    margin-bottom: 10px; cursor: pointer; user-select: none;
  }
  .section-header svg { flex-shrink: 0; opacity: 0.6; transition: transform 0.2s ease; }
  .section-header.collapsed svg { transform: rotate(-90deg); }
  .section-body { margin-bottom: 4px; }
  .section-body.hidden { display: none; }

  /* ── rows and fields ── */
  .row { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; }
  .row.col { flex-direction: column; gap: 4px; }
  .row.full { flex-direction: column; }
  .half { flex: 1 1 calc(50% - 4px); min-width: 100px; }
  .third { flex: 1 1 calc(33% - 6px); min-width: 80px; }

  /* ── reuse HA paper elements or fallback to plain inputs ── */
  label {
    display: block; font-size: 12px; color: var(--secondary-text-color, #6b7280);
    margin-bottom: 3px; font-weight: 500;
  }

  input[type=text], input[type=number], input[type=color], select {
    width: 100%; padding: 8px 10px; border-radius: 6px;
    border: 1px solid var(--divider-color, #d1d5db);
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color, #111);
    font-size: 13px; box-sizing: border-box;
    transition: border-color 0.15s;
    font-family: inherit;
  }
  input[type=text]:focus, input[type=number]:focus, select:focus {
    outline: none; border-color: var(--primary-color, #e8824a);
  }
  input[type=color] { height: 36px; padding: 2px 4px; cursor: pointer; }

  input[type=range] {
    width: 100%; accent-color: var(--primary-color, #e8824a);
    margin-top: 2px;
  }
  .range-row { display: flex; align-items: center; gap: 8px; }
  .range-row input[type=range] { flex: 1; }
  .range-val { font-size: 12px; font-weight: 700; color: var(--primary-color, #e8824a); min-width: 32px; text-align: right; }

  /* toggle switch */
  .toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
  .toggle-row label { margin: 0; }
  .switch { position: relative; display: inline-block; width: 36px; height: 20px; flex-shrink: 0; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider-sw {
    position: absolute; cursor: pointer; inset: 0; border-radius: 20px;
    background: var(--divider-color, #ccc); transition: .2s;
  }
  .slider-sw::before {
    content: ''; position: absolute; height: 14px; width: 14px;
    left: 3px; bottom: 3px; border-radius: 50%;
    background: white; transition: .2s;
    box-shadow: 0 1px 3px rgba(0,0,0,.3);
  }
  input:checked + .slider-sw { background: var(--primary-color, #e8824a); }
  input:checked + .slider-sw::before { transform: translateX(16px); }

  /* color field: swatch preview + hex text input */
  .color-field { display: flex; align-items: center; gap: 6px; }
  .color-swatch {
    width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
    border: 1px solid var(--divider-color, #d1d5db);
    cursor: pointer; position: relative; overflow: hidden;
  }
  .color-swatch input[type=color] {
    position: absolute; inset: -4px; width: calc(100% + 8px); height: calc(100% + 8px);
    opacity: 0; cursor: pointer; padding: 0; border: none;
  }
  .color-text { flex: 1; min-width: 0; }
  .color-text input[type=text] { font-family: monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }

  /* ha-entity-picker shim — uses ha element if available */
  ha-entity-picker, ha-icon-picker { display: block; width: 100%; margin-bottom: 8px; }
`;

class NeumorphicButtonCardEditor extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass   = null;
    this._sections = {};
  }

  set hass(hass) { this._hass = hass; }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config)); // deep clone
    this._render();
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  _val(path, fallback) {
    const parts = path.split('.');
    let obj = this._config;
    for (const p of parts) {
      if (obj == null || typeof obj !== 'object') return fallback;
      obj = obj[p];
    }
    return obj ?? fallback;
  }

  _set(path, value) {
    const parts = path.split('.');
    let obj = this._config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (obj[parts[i]] == null || typeof obj[parts[i]] !== 'object') obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    this._fire();
  }

  _fire() {
    // strip internal _ keys before firing
    const clean = Object.fromEntries(Object.entries(this._config).filter(([k]) => !k.startsWith('_')));
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: clean }, bubbles: true, composed: true }));
  }

  // ── section collapse toggle ────────────────────────────────────────────────
  _toggleSection(id) {
    this._sections[id] = !this._sections[id]; // true = collapsed
    const header = this._shadow.querySelector(`[data-sec="${id}"]`);
    const body   = this._shadow.querySelector(`[data-secbody="${id}"]`);
    if (header && body) {
      header.classList.toggle('collapsed', !!this._sections[id]);
      body.classList.toggle('hidden', !!this._sections[id]);
    }
  }

  // ── building blocks ────────────────────────────────────────────────────────
  _section(id, title, icon, content) {
    const collapsed = !!this._sections[id];
    return `
    <div class="section-header ${collapsed ? 'collapsed' : ''}" data-sec="${id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
      ${icon} &nbsp;${title}
    </div>
    <div class="section-body ${collapsed ? 'hidden' : ''}" data-secbody="${id}">
      ${content}
    </div>`;
  }

  _text(path, label, placeholder = '') {
    return `<div class="row col"><label>${label}</label><input type="text" data-path="${path}" value="${this._val(path,'')}" placeholder="${placeholder}"></div>`;
  }

  _number(path, label, min, max, step = 1) {
    return `<div class="row col"><label>${label}</label><input type="number" data-path="${path}" value="${this._val(path,0)}" min="${min}" max="${max}" step="${step}"></div>`;
  }

  _range(path, label, min, max, step, suffix = '') {
    const v = this._val(path, min);
    return `<div class="row col">
      <label>${label}</label>
      <div class="range-row">
        <input type="range" data-path="${path}" value="${v}" min="${min}" max="${max}" step="${step}">
        <span class="range-val" data-rangeval="${path}">${v}${suffix}</span>
      </div>
    </div>`;
  }

  _select(path, label, options) {
    const cur = this._val(path, options[0].value);
    const opts = options.map(o => `<option value="${o.value}" ${cur === o.value ? 'selected' : ''}>${o.label}</option>`).join('');
    return `<div class="row col"><label>${label}</label><select data-path="${path}">${opts}</select></div>`;
  }

  _toggle(path, label) {
    const checked = this._val(path, false);
    return `<div class="toggle-row"><label>${label}</label>
      <label class="switch"><input type="checkbox" data-path="${path}" ${checked ? 'checked' : ''}><span class="slider-sw"></span></label>
    </div>`;
  }

  _color(path, label, defaultColor) {
    const fallback = defaultColor || '#e8824a';
    let raw = this._val(path, fallback) || fallback;
    // ensure valid 6-digit hex for native input
    if (!raw.startsWith('#')) raw = '#' + raw;
    if (!/^#[0-9a-fA-F]{6}$/.test(raw)) raw = fallback;
    const display = raw.toUpperCase();
    return `<div class="row col">
      <label>${label}</label>
      <div class="color-field" data-colorpath="${path}">
        <div class="color-swatch" style="background:${raw}">
          <input type="color" value="${raw}">
        </div>
        <div class="color-text">
          <input type="text" class="color-hex" value="${display}" placeholder="#RRGGBB" maxlength="7">
        </div>
      </div>
    </div>`;
  }

  _entityPicker() {
    // Use HA's native ha-entity-picker if available, else plain text input
    const v = this._val('entity', '');
    if (customElements.get('ha-entity-picker')) {
      return `<ha-entity-picker data-path="entity" value="${v}" allow-custom-entity></ha-entity-picker>`;
    }
    return this._text('entity', 'Entity', 'light.my_light');
  }

  _iconPicker() {
    const v = this._val('icon', '');
    if (customElements.get('ha-icon-picker')) {
      return `<ha-icon-picker data-path="icon" value="${v}"></ha-icon-picker>`;
    }
    return this._text('icon', 'Icon (MDI)', 'mdi:lightbulb');
  }

  // Font loading is handled via @import inside the card's shadow DOM style.
  // This stub exists so call sites don't break.
  _loadGoogleFont(_family) {}

  // Font families: web-safe + common Google Fonts (loaded on demand) + custom
  _fontFamily(path, label) {
    const PRESETS = [
      { value: '',                    label: 'Default (inherit from theme)' },
      // ── System / web-safe ──
      { value: 'system-ui',           label: 'System UI' },
      { value: 'Arial',               label: 'Arial' },
      { value: 'Helvetica Neue',      label: 'Helvetica Neue' },
      { value: 'Georgia',             label: 'Georgia' },
      { value: 'Times New Roman',     label: 'Times New Roman' },
      { value: 'Courier New',         label: 'Courier New' },
      // ── Google Fonts ──
      { value: 'Roboto',              label: 'Roboto' },
      { value: 'Open Sans',           label: 'Open Sans' },
      { value: 'Lato',                label: 'Lato' },
      { value: 'Montserrat',          label: 'Montserrat' },
      { value: 'Raleway',             label: 'Raleway' },
      { value: 'Poppins',             label: 'Poppins' },
      { value: 'Nunito',              label: 'Nunito' },
      { value: 'Oswald',              label: 'Oswald' },
      { value: 'Playfair Display',    label: 'Playfair Display' },
      { value: 'Merriweather',        label: 'Merriweather' },
      { value: 'Ubuntu',              label: 'Ubuntu' },
      { value: 'Inter',               label: 'Inter' },
      { value: 'Source Sans Pro',     label: 'Source Sans Pro' },
      { value: 'Exo 2',               label: 'Exo 2' },
      { value: 'Josefin Sans',        label: 'Josefin Sans' },
      { value: 'Quicksand',           label: 'Quicksand' },
      { value: '__custom__',          label: '✏ Custom…' },
    ];
    const cur = this._val(path, '');
    const isCustom = cur && !PRESETS.find(p => p.value === cur && p.value !== '__custom__');
    const selectVal = isCustom ? '__custom__' : cur;
    const opts = PRESETS.map(p =>
      `<option value="${p.value}"${selectVal === p.value ? ' selected' : ''}>${p.label}</option>`
    ).join('');
    return `<div class="row col">
      <label>${label}</label>
      <select data-path="${path}" data-font-select>
        ${opts}
      </select>
      <input type="text" data-path="${path}" placeholder="e.g. Dancing Script"
        style="${isCustom ? '' : 'display:none'}"
        value="${isCustom ? cur : ''}"
        data-font-custom>
      <small class="font-hint" style="font-size:10px;color:var(--secondary-text-color,#8891a0);margin-top:2px">
        Google Fonts are loaded automatically when selected.
      </small>
    </div>`;
  }

  _labelSection(prefix, title) {
    const visPath = `${prefix}.visible`;
    const visible = this._val(visPath, true);
    return `
      ${this._toggle(visPath, 'Visible')}
      ${visible ? `
        ${prefix === 'label_major' ? this._select(`${prefix}.position`, 'Position', [
          {value:'bottom',label:'Bottom'},{value:'top',label:'Top'},
          {value:'left',label:'Left'},{value:'right',label:'Right'},
        ]) : ''}
        ${this._text(`${prefix}.text`, 'Text (blank = entity name)')}
        <div class="row">
          <div class="third">${this._number(`${prefix}.font_size`, 'Size (px)', 8, 48)}</div>
          <div class="third">${this._select(`${prefix}.font_weight`, 'Weight', [
            {value:'300',label:'300 – Light'},{value:'400',label:'400 – Normal'},
            {value:'500',label:'500 – Medium'},{value:'600',label:'600 – Semi'},
            {value:'700',label:'700 – Bold'},{value:'800',label:'800 – Extra'},
          ])}</div>
          <div class="third">${this._select(`${prefix}.font_style`, 'Style', [
            {value:'normal',label:'Normal'},{value:'italic',label:'Italic'},
          ])}</div>
        </div>
        ${this._fontFamily(`${prefix}.font_family`, 'Font family')}
        <div class="row">
          <div class="half">${this._select(`${prefix}.text_transform`, 'Transform', [
            {value:'none',label:'None'},{value:'uppercase',label:'Uppercase'},
            {value:'lowercase',label:'Lowercase'},{value:'capitalize',label:'Capitalize'},
          ])}</div>
          <div class="half">${this._select(`${prefix}.align`, 'Align', [
            {value:'center',label:'Center'},{value:'left',label:'Left'},{value:'right',label:'Right'},
          ])}</div>
        </div>
        <div class="row">
          <div class="half">${this._range(`${prefix}.letter_spacing`, 'Letter spacing (em)', 0, 0.3, 0.01)}</div>
          <div class="half">${this._range(`${prefix}.opacity`, 'Opacity', 0, 1, 0.05)}</div>
        </div>
        <div class="row">
          <div class="half">${this._color(`${prefix}.color`, 'Color', '#4a4f5a')}</div>
          <div class="half">${this._number(`${prefix}.max_width`, 'Max width (px, 0=auto)', 0, 400)}</div>
        </div>
        ${this._toggle(`${prefix}.truncate`, 'Truncate with ellipsis')}
      ` : ''}
    `;
  }

  // ── main render ────────────────────────────────────────────────────────────
  _render() {
    const style = document.createElement('style');
    style.textContent = EDITOR_STYLES;

    const html = `
    ${this._section('entity', 'Entity & Icon', '🔌', `
      ${this._entityPicker()}
      ${this._iconPicker()}
      <div class="row">
        <div class="half">${this._color('icon_on_color', 'Icon color ON', '#e8824a')}</div>
        <div class="half">${this._color('icon_off_color', 'Icon color OFF', '#a0a0a8')}</div>
      </div>
      ${this._select('tap_action', 'Tap action', [
        {value:'toggle',label:'Toggle'},{value:'more-info',label:'More info'},{value:'call-service',label:'Call service'},
      ])}
      ${this._val('tap_action','toggle') === 'call-service' ? `
        ${this._text('service', 'Service (domain.service)', 'light.turn_on')}
      ` : ''}
      ${this._select('hold_action', 'Hold action', [
        {value:'none',label:'None'},{value:'toggle',label:'Toggle'},
        {value:'more-info',label:'More info'},{value:'call-service',label:'Call service'},
      ])}
      ${this._range('hold_timeout', 'Hold duration (ms)', 200, 2000, 50, 'ms')}
      ${this._val('hold_action','none') === 'call-service' ? `
        ${this._text('hold_service', 'Hold service (domain.service)', 'scene.turn_on')}
      ` : ''}
    `)}

    ${this._section('button', 'Button style', '⬤', `
      ${this._toggle('display_only', 'Display only (read-only value, no knob)')}
      ${this._val('display_only', false) ? '' : `
      <div class="row">
        <div class="half">${this._range('size', 'Size (px)', 36, 120, 2, 'px')}</div>
        <div class="half">${this._range('icon_size', 'Icon size (px)', 10, 80, 1, 'px')}</div>
      </div>
      ${this._select('shape', 'Shape', [
        {value:'round',label:'Round (circle)'},{value:'squircle',label:'Squircle'},{value:'square',label:'Square'},
      ])}
      <div class="row">
        <div class="half">${this._range('depth', '3D Depth', 0, 2, 0.1)}</div>
        <div class="half">${this._range('glow_intensity', 'Glow intensity', 0, 2, 0.1)}</div>
      </div>
      ${this._toggle('show_dot', 'Show state dot')}
      `}
      ${this._select('card_mode', 'Card background', [
        {value:'default', label:'Default — neumorphic card with shadow'},
        {value:'flat',    label:'Flat — transparent, no shadow, small padding'},
        {value:'none',    label:'None — invisible container, zero padding'},
      ])}
    `)}

    ${this._section('anim', 'Icon animation', '✨', `
      ${this._select('icon_animation', 'Animation (plays when ON)', [
        {value:'none',label:'None'},{value:'pulse',label:'Pulse'},
        {value:'spin',label:'Spin'},{value:'bounce',label:'Bounce'},
        {value:'swing',label:'Swing'},{value:'flash',label:'Flash'},
      ])}
    `)}

    ${this._section('major', 'Major label', '𝗔', this._labelSection('label_major', 'Major label'))}
    ${this._section('minor', 'Minor label', 'ᴬ', this._labelSection('label_minor', 'Minor label'))}
    `;

    const container = document.createElement('div');
    container.innerHTML = html;

    // ── wire up events ────────────────────────────────────────────────────────
    // Text / number / color inputs → blur + enter
    container.querySelectorAll('input[type=text], input[type=number]').forEach(el => {
      el.addEventListener('change', (e) => {
        const v = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
        this._set(e.target.dataset.path, v);
        this._render();
      });
    });

    // ── Color fields: swatch (native color input hidden behind swatch) + text ──
    container.querySelectorAll('.color-field').forEach(field => {
      const path    = field.dataset.colorpath;
      const swatch  = field.querySelector('.color-swatch');
      const native  = field.querySelector('input[type=color]');
      const text    = field.querySelector('input[type=text].color-hex');

      // native color picker → update swatch bg + text field live
      native.addEventListener('input', (e) => {
        swatch.style.background = e.target.value;
        text.value = e.target.value.toUpperCase();
      });
      native.addEventListener('change', (e) => {
        swatch.style.background = e.target.value;
        text.value = e.target.value.toUpperCase();
        this._set(path, e.target.value);
        this._render();
      });

      // text field → validate hex and update swatch
      text.addEventListener('input', (e) => {
        let v = e.target.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          swatch.style.background = v;
          native.value = v;
        }
      });
      text.addEventListener('change', (e) => {
        let v = e.target.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
          this._set(path, v);
          this._render();
        }
      });
    });

    // Range sliders → live update value display + debounced config fire
    container.querySelectorAll('input[type=range]').forEach(el => {
      el.addEventListener('input', (e) => {
        const valEl = this._shadow.querySelector(`[data-rangeval="${e.target.dataset.path}"]`);
        if (valEl) valEl.textContent = e.target.value + (e.target.dataset.suffix ?? '');
      });
      el.addEventListener('change', (e) => {
        this._set(e.target.dataset.path, Number(e.target.value));
        this._render();
      });
    });

    // Selects (including font-family with custom sub-field)
    container.querySelectorAll('select').forEach(el => {
      el.addEventListener('change', (e) => {
        if (e.target.dataset.fontSelect !== undefined) {
          const val = e.target.value;
          const customInput = e.target.nextElementSibling;
          if (val === '__custom__') {
            customInput.style.display = '';
            customInput.focus();
            return; // don't fire config-changed yet; wait for text input
          } else {
            customInput.style.display = 'none';
            if (val) this._loadGoogleFont(val);
            this._set(e.target.dataset.path, val);
            this._render();
          }
        } else {
          this._set(e.target.dataset.path, e.target.value);
          this._render();
        }
      });
    });

    // Custom font text inputs
    container.querySelectorAll('input[data-font-custom]').forEach(el => {
      el.addEventListener('change', (e) => {
        const v = e.target.value.trim();
        if (v) this._loadGoogleFont(v);
        this._set(e.target.dataset.path, v);
        this._render();
      });
    });

    // Toggles / checkboxes
    container.querySelectorAll('input[type=checkbox]').forEach(el => {
      el.addEventListener('change', (e) => {
        this._set(e.target.dataset.path, e.target.checked);
        this._render();
      });
    });

    // Section collapse headers
    container.querySelectorAll('.section-header').forEach(el => {
      el.addEventListener('click', () => this._toggleSection(el.dataset.sec));
    });

    // ha-entity-picker / ha-icon-picker custom events
    container.querySelectorAll('ha-entity-picker, ha-icon-picker').forEach(el => {
      el.hass = this._hass;
      el.addEventListener('value-changed', (e) => {
        this._set(el.dataset.path, e.detail.value);
        this._render();
      });
    });

    this._shadow.innerHTML = '';
    this._shadow.appendChild(style);
    this._shadow.appendChild(container);
  }
}

customElements.define('neumorphic-button-card-editor', NeumorphicButtonCardEditor);

// Link editor to card
NeumorphicButtonCard.prototype.getCardSize = function() {
  const s = this._config?._knobSize ?? 68;
  return s >= 100 ? 3 : s <= 48 ? 1 : 2;
};

// ── Wire editor to card (all HA hooks) ───────────────────────────────────────
// Hook 1: newer HA versions call getConfigElement()
NeumorphicButtonCard.getConfigElement = () => document.createElement('neumorphic-button-card-editor');
// Hook 2: some HA versions read the cardEditor property
NeumorphicButtonCard.cardEditor = 'neumorphic-button-card-editor';

(window.customCards = window.customCards ?? []).push({
  type:        'neumorphic-button-card',
  name:        'Neumorphic Button Card',
  description: 'Neumorphic button v10. card_mode, icon_off_color, hold_action, shape, depth, glow, labels, animations.',
  preview:     true,
  documentationURL: 'https://github.com/etnlbck/hacs-neumorphic-template',
});

console.info(
  '%c NEUMORPHIC-BUTTON-CARD %c v15 ',
  'color:#fff;background:#e8824a;padding:2px 6px;border-radius:4px 0 0 4px;font-weight:700',
  'color:#e8824a;background:#1c1c1c;padding:2px 6px;border-radius:0 4px 4px 0;font-weight:700',
);
