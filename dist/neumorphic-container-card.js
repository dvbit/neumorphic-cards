/**
 * neumorphic-container-card  v1.1.0
 * ─────────────────────────────────────────────────────────────────
 * A dependency-free Home Assistant Lovelace custom card.
 * Wraps child cards in a neumorphic panel with a full visual editor.
 *
 * Inspired by:
 *   • https://github.com/etnlbck/hacs-neumorphic-template
 *   • https://github.com/PiotrMachowski/Home-Assistant-Lovelace-Local-Conditional-card
 *
 * Config options:
 *   type:         custom:neumorphic-container-card
 *   title:        "My Section"      # optional
 *   icon:         mdi:home          # optional MDI icon
 *   style:        raised            # raised | inset | flat
 *   padding:      16                # px
 *   radius:       16                # px
 *   gap:          12                # px between children
 *   columns:      1                 # grid columns 1–4 (default 1 = single column)
 *   collapsible:  false             # click header to collapse
 *   default_open: true              # initial open state
 *   cards:                          # required – list of child card configs
 *     - type: entities
 *       entities: [sun.sun]
 */

const VERSION = "1.2.0";
const EDITOR_TAG = "neumorphic-container-card-editor";

// ═══════════════════════════════════════════════════════════════════
//  SVG ICON HELPER
// ═══════════════════════════════════════════════════════════════════
const SVG_PATHS = {
  chevron: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  edit:    "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  delete:  "M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  up:      "M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z",
  down:    "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  add:     "M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z",
};

function svgIcon(name) {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="${SVG_PATHS[name]}"/></svg>`;
}

// ═══════════════════════════════════════════════════════════════════
//  MINI YAML SERIALISER / PARSER
//  (handles the simple subset used in HA card configs)
// ═══════════════════════════════════════════════════════════════════
function toYaml(obj, indent) {
  indent = indent || 0;
  var pad = Array(indent + 1).join("  ");
  if (Array.isArray(obj)) {
    if (!obj.length) return "[]";
    return obj.map(function(item) {
      var v = toYaml(item, indent + 1);
      if (typeof item === "object" && item !== null) {
        return pad + "-\n" + v;
      }
      return pad + "- " + v;
    }).join("\n");
  }
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).map(function(k) {
      var v = obj[k];
      if (Array.isArray(v)) {
        if (!v.length) return pad + k + ": []";
        return pad + k + ":\n" + toYaml(v, indent + 1);
      }
      if (v !== null && typeof v === "object") {
        return pad + k + ":\n" + toYaml(v, indent + 1);
      }
      return pad + k + ": " + v;
    }).join("\n");
  }
  return String(obj);
}

function parseScalar(s) {
  if (s === "true")  return true;
  if (s === "false") return false;
  if (s === "null" || s === "~") return null;
  if (s !== "" && !isNaN(s)) return Number(s);
  if ((s[0] === "'" && s[s.length-1] === "'") ||
      (s[0] === '"' && s[s.length-1] === '"')) return s.slice(1,-1);
  return s;
}

function parseBlock(lines, cursor, baseIndent) {
  var obj = {}, list = null;
  while (cursor.pos < lines.length) {
    var raw = lines[cursor.pos];
    if (!raw.trim() || raw.trim()[0] === "#") { cursor.pos++; continue; }
    var ind = raw.search(/\S/);
    if (ind < baseIndent) break;
    var line = raw.trim();
    if (line.slice(0,2) === "- ") {
      if (list === null) list = [];
      var rest = line.slice(2).trim();
      cursor.pos++;
      if (!rest) { list.push(parseBlock(lines, cursor, ind + 2)); }
      else { list.push(parseScalar(rest)); }
      continue;
    }
    var ci = line.indexOf(": ");
    var ce = line.endsWith(":") ? line.length - 1 : -1;
    if (ci === -1 && ce === -1) { cursor.pos++; continue; }
    var key = ci !== -1 ? line.slice(0, ci) : line.slice(0, ce);
    cursor.pos++;
    if (ci === -1) {
      obj[key] = parseBlock(lines, cursor, ind + 2);
    } else {
      var val = line.slice(ci + 2).trim();
      if (!val || val === "|" || val === ">") {
        obj[key] = parseBlock(lines, cursor, ind + 2);
      } else {
        obj[key] = parseScalar(val);
      }
    }
  }
  return list !== null ? list : obj;
}

function fromYaml(text) {
  var t = text.trim();
  if (t[0] === "{" || t[0] === "[") return JSON.parse(t);
  return parseBlock(text.split("\n"), { pos: 0 }, 0);
}

// ═══════════════════════════════════════════════════════════════════
//  CARD STYLES
// ═══════════════════════════════════════════════════════════════════
var CARD_STYLES = [
  ":host{display:block}",
  ".nm-container{",
  "  --nm-bg:var(--primary-background-color,#e0e5ec);",
  "  --nm-shadow-dark:var(--nm-shadow-dark-color,rgba(163,177,198,.6));",
  "  --nm-shadow-light:var(--nm-shadow-light-color,rgba(255,255,255,.8));",
  "  --nm-text:var(--primary-text-color,#44506a);",
  "  --nm-accent:var(--accent-color,#6c8ebf);",
  "  --nm-radius:16px;--nm-padding:16px;--nm-gap:12px;",
  "  background:var(--nm-bg);border-radius:var(--nm-radius);",
  "  padding:var(--nm-padding);box-sizing:border-box;transition:box-shadow .25s ease}",
  ".nm-container.style-raised{box-shadow:6px 6px 12px var(--nm-shadow-dark),-6px -6px 12px var(--nm-shadow-light)}",
  ".nm-container.style-inset{box-shadow:inset 6px 6px 12px var(--nm-shadow-dark),inset -6px -6px 12px var(--nm-shadow-light)}",
  ".nm-container.style-flat{box-shadow:3px 3px 6px var(--nm-shadow-dark),-3px -3px 6px var(--nm-shadow-light);opacity:.9}",
  ".nm-header{display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;",
  "  border-bottom:1px solid rgba(0,0,0,.06);cursor:default;user-select:none}",
  ".nm-header.clickable{cursor:pointer}",
  ".nm-header-icon{--mdc-icon-size:20px;color:var(--nm-accent);display:flex;align-items:center}",
  ".nm-header-title{flex:1;font-size:.95rem;font-weight:600;letter-spacing:.03em;",
  "  color:var(--nm-text);text-transform:uppercase}",
  ".nm-header-toggle{color:var(--nm-text);opacity:.45;display:flex;align-items:center;",
  "  transition:transform .25s ease,opacity .2s ease}",
  ".nm-header-toggle.collapsed{transform:rotate(-90deg)}",
  ".nm-cards{display:grid;grid-template-columns:repeat(var(--nm-cols,1),1fr);",
  "  gap:var(--nm-gap);overflow:hidden;",
  "  transition:max-height .35s cubic-bezier(.4,0,.2,1),opacity .25s ease;max-height:9999px;opacity:1}",
  ".nm-cards.collapsed{max-height:0!important;opacity:0;pointer-events:none}",
  ".nm-child-wrap{border-radius:10px;overflow:hidden;background:var(--nm-bg);",
  "  box-shadow:inset 3px 3px 7px var(--nm-shadow-dark),inset -3px -3px 7px var(--nm-shadow-light)}",
].join("\n");

// ═══════════════════════════════════════════════════════════════════
//  EDITOR STYLES
// ═══════════════════════════════════════════════════════════════════
var EDITOR_STYLES = `
:host{display:block}
.editor-wrap{
  --nm-bg:var(--primary-background-color,#e0e5ec);
  --nm-shadow-dark:var(--nm-shadow-dark-color,rgba(163,177,198,.5));
  --nm-shadow-light:var(--nm-shadow-light-color,rgba(255,255,255,.8));
  --nm-text:var(--primary-text-color,#44506a);
  --nm-text-sec:var(--secondary-text-color,#6b7a99);
  --nm-accent:var(--accent-color,#6c8ebf);
  --nm-red:var(--error-color,#d9534f);
  background:var(--nm-bg);
  border-radius:12px;
  padding:16px;
  box-shadow:4px 4px 8px var(--nm-shadow-dark),-4px -4px 8px var(--nm-shadow-light);
  display:flex;flex-direction:column;gap:14px;
  font-family:var(--paper-font-body1_-_font-family,sans-serif);
  color:var(--nm-text);box-sizing:border-box;
}
.section-title{
  font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--nm-text-sec);margin:4px 0 2px;padding-bottom:4px;
  border-bottom:1px solid rgba(0,0,0,.07);
}
.row{display:flex;gap:10px}
.row>*{flex:1;min-width:0}
.nm-field{display:flex;flex-direction:column;gap:4px}
.nm-field label{font-size:.75rem;font-weight:600;color:var(--nm-text-sec);letter-spacing:.02em}
.nm-field input[type=text],.nm-field input[type=number],.nm-field select{
  appearance:none;-webkit-appearance:none;
  background:var(--nm-bg);border:none;outline:none;
  border-radius:8px;padding:8px 10px;font-size:.9rem;color:var(--nm-text);
  box-shadow:inset 3px 3px 6px var(--nm-shadow-dark),inset -3px -3px 6px var(--nm-shadow-light);
  width:100%;box-sizing:border-box;transition:box-shadow .15s ease;cursor:pointer;
}
.nm-field input[type=text]:focus,.nm-field input[type=number]:focus,.nm-field select:focus{
  box-shadow:inset 2px 2px 5px var(--nm-shadow-dark),inset -2px -2px 5px var(--nm-shadow-light),
    0 0 0 2px var(--nm-accent);
}
.nm-field input[type=number]{-moz-appearance:textfield}
.nm-field input[type=number]::-webkit-inner-spin-button,
.nm-field input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
.nm-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nm-toggle-label{font-size:.85rem;font-weight:500;color:var(--nm-text)}
.nm-switch{position:relative;width:42px;height:24px;flex-shrink:0}
.nm-switch input{opacity:0;width:0;height:0}
.nm-switch .track{
  position:absolute;inset:0;border-radius:12px;background:var(--nm-bg);
  box-shadow:inset 2px 2px 5px var(--nm-shadow-dark),inset -2px -2px 5px var(--nm-shadow-light);
  transition:background .2s;cursor:pointer;
}
.nm-switch input:checked+.track{background:var(--nm-accent)}
.nm-switch .thumb{
  position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;
  background:var(--nm-bg);box-shadow:1px 1px 4px var(--nm-shadow-dark);
  transition:transform .2s;pointer-events:none;
}
.nm-switch input:checked~.thumb{transform:translateX(18px)}
.style-picker{display:flex;gap:8px}
.style-btn{
  flex:1;padding:8px 4px;border:none;border-radius:8px;background:var(--nm-bg);
  color:var(--nm-text-sec);font-size:.8rem;font-weight:600;letter-spacing:.02em;cursor:pointer;
  transition:box-shadow .15s ease,color .15s ease;
  box-shadow:3px 3px 6px var(--nm-shadow-dark),-3px -3px 6px var(--nm-shadow-light);
}
.style-btn:hover{color:var(--nm-accent)}
.style-btn.active{
  box-shadow:inset 3px 3px 6px var(--nm-shadow-dark),inset -3px -3px 6px var(--nm-shadow-light);
  color:var(--nm-accent);font-weight:700;
}
.nm-slider-row{display:flex;align-items:center;gap:10px}
.nm-slider-row input[type=range]{
  flex:1;-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;
  background:var(--nm-bg);
  box-shadow:inset 2px 2px 4px var(--nm-shadow-dark),inset -2px -2px 4px var(--nm-shadow-light);
  outline:none;cursor:pointer;
}
.nm-slider-row input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;width:18px;height:18px;border-radius:50%;
  background:var(--nm-accent);box-shadow:1px 1px 4px var(--nm-shadow-dark);cursor:pointer;
}
.nm-slider-row input[type=range]::-moz-range-thumb{
  width:18px;height:18px;border-radius:50%;background:var(--nm-accent);
  border:none;box-shadow:1px 1px 4px var(--nm-shadow-dark);cursor:pointer;
}
.nm-slider-val{min-width:36px;text-align:right;font-size:.85rem;font-weight:600;color:var(--nm-accent)}
.cards-list{display:flex;flex-direction:column;gap:8px}
.card-item{
  display:flex;align-items:center;gap:8px;background:var(--nm-bg);
  border-radius:8px;padding:8px 10px;
  box-shadow:inset 2px 2px 5px var(--nm-shadow-dark),inset -2px -2px 5px var(--nm-shadow-light);
}
.card-item-label{
  flex:1;font-size:.85rem;font-weight:500;color:var(--nm-text);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.card-item-badge{
  font-size:.7rem;padding:2px 7px;border-radius:4px;background:var(--nm-accent);
  color:#fff;font-weight:700;letter-spacing:.02em;flex-shrink:0;
}
.icon-btn{
  display:flex;align-items:center;justify-content:center;
  width:28px;height:28px;border:none;border-radius:7px;background:var(--nm-bg);
  color:var(--nm-text-sec);cursor:pointer;flex-shrink:0;padding:0;
  box-shadow:2px 2px 5px var(--nm-shadow-dark),-2px -2px 5px var(--nm-shadow-light);
  transition:color .15s,box-shadow .15s;
}
.icon-btn:hover{color:var(--nm-accent)}
.icon-btn.danger:hover{color:var(--nm-red)}
.icon-btn.active{
  box-shadow:inset 2px 2px 4px var(--nm-shadow-dark),inset -2px -2px 4px var(--nm-shadow-light);
  color:var(--nm-accent);
}
.add-card-btn{
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px;border:none;border-radius:8px;background:var(--nm-bg);
  color:var(--nm-accent);font-size:.85rem;font-weight:600;cursor:pointer;
  box-shadow:3px 3px 6px var(--nm-shadow-dark),-3px -3px 6px var(--nm-shadow-light);
  transition:box-shadow .15s,opacity .15s;width:100%;
}
.add-card-btn:hover{opacity:.85}
.yaml-area{display:none;flex-direction:column;gap:6px;
  background:var(--nm-bg);border-radius:10px;padding:12px;
  box-shadow:inset 3px 3px 7px var(--nm-shadow-dark),inset -3px -3px 7px var(--nm-shadow-light);
}
.yaml-area.open{display:flex}
.yaml-area textarea{
  width:100%;min-height:120px;resize:vertical;background:transparent;
  border:none;outline:none;border-radius:6px;padding:8px;
  font-size:.82rem;font-family:monospace;color:var(--nm-text);
  border:1px solid rgba(0,0,0,.08);box-sizing:border-box;
}
.yaml-area textarea:focus{outline:2px solid var(--nm-accent);outline-offset:0}
.yaml-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:2px}
.yaml-btn{
  padding:6px 14px;border:none;border-radius:7px;background:var(--nm-bg);
  font-size:.8rem;font-weight:600;cursor:pointer;color:var(--nm-text-sec);
  box-shadow:2px 2px 5px var(--nm-shadow-dark),-2px -2px 5px var(--nm-shadow-light);
  transition:color .15s;
}
.yaml-btn.primary{color:var(--nm-accent)}
.yaml-btn:hover{opacity:.85}
.yaml-error{
  font-size:.78rem;color:var(--nm-red);padding:4px 8px;
  background:rgba(217,83,79,.08);border-radius:5px;
}
.note{
  font-size:.75rem;color:var(--nm-text-sec);padding:6px 8px;
  background:rgba(108,142,191,.08);border-radius:6px;
  border-left:3px solid var(--nm-accent);line-height:1.5;
}
`;

// ═══════════════════════════════════════════════════════════════════
//  VISUAL EDITOR ELEMENT
// ═══════════════════════════════════════════════════════════════════
class NeumorphicContainerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass   = null;
    this._editingIdx = null; // null | number | "new"
  }

  set hass(h) { this._hass = h; }

  setConfig(config) {
    this._config = {
      style:        config.style        !== undefined ? config.style        : "raised",
      title:        config.title        !== undefined ? config.title        : "",
      icon:         config.icon         !== undefined ? config.icon         : "",
      padding:      config.padding      !== undefined ? config.padding      : 16,
      radius:       config.radius       !== undefined ? config.radius       : 16,
      gap:          config.gap          !== undefined ? config.gap          : 12,
      columns:      config.columns      !== undefined ? config.columns      : 1,
      collapsible:  config.collapsible  !== undefined ? config.collapsible  : false,
      default_open: config.default_open !== undefined ? config.default_open : true,
      cards:        Array.isArray(config.cards) ? config.cards.slice() : [],
    };
    this._render();
  }

  _fire() {
    var cfg = this._config;
    // HA requires "type" to always be present in the config-changed payload,
    // otherwise the editor throws "No type provided" / "Nessun tipo fornito".
    var out = {
      type:         "custom:neumorphic-container-card",
      style:        cfg.style,
      columns:      cfg.columns,
      padding:      cfg.padding,
      radius:       cfg.radius,
      gap:          cfg.gap,
      collapsible:  cfg.collapsible,
      default_open: cfg.default_open,
      cards:        cfg.cards,
    };
    // Only include optional string fields when they have a value
    if (cfg.title) out.title = cfg.title;
    if (cfg.icon)  out.icon  = cfg.icon;

    var ev = new CustomEvent("config-changed", {
      bubbles: true, composed: true,
      detail: { config: out },
    });
    this.dispatchEvent(ev);
  }

  _render() {
    var root = this.shadowRoot;
    root.innerHTML = "";
    var style = document.createElement("style");
    style.textContent = EDITOR_STYLES;
    root.appendChild(style);
    var wrap = document.createElement("div");
    wrap.className = "editor-wrap";
    root.appendChild(wrap);
    this._wrap = wrap;
    this._buildContent();
  }

  _buildContent() {
    var wrap = this._wrap;
    wrap.innerHTML = "";
    var cfg = this._config;

    // ── APPEARANCE ────────────────────────────────────────────────
    wrap.appendChild(this._sectionTitle("Appearance"));

    // Style picker
    var sp = this._el("div", "style-picker");
    ["raised","inset","flat"].forEach(function(s) {
      var btn = this._el("button", "style-btn" + (cfg.style === s ? " active" : ""));
      btn.textContent = s[0].toUpperCase() + s.slice(1);
      btn.addEventListener("click", function() {
        this._config.style = s;
        this._fire(); this._buildContent();
      }.bind(this));
      sp.appendChild(btn);
    }.bind(this));
    wrap.appendChild(this._fieldWrap("Style", sp));

    // Columns picker
    var cp = this._el("div", "style-picker");
    [1, 2, 3, 4].forEach(function(n) {
      var btn = this._el("button", "style-btn" + (cfg.columns === n ? " active" : ""));
      btn.textContent = n + (n === 1 ? " col" : " cols");
      btn.addEventListener("click", function() {
        this._config.columns = n;
        this._fire(); this._buildContent();
      }.bind(this));
      cp.appendChild(btn);
    }.bind(this));
    wrap.appendChild(this._fieldWrap("Grid columns", cp));

    // ── HEADER ───────────────────────────────────────────────────
    wrap.appendChild(this._sectionTitle("Header"));

    var row1 = this._el("div", "row");
    row1.appendChild(this._textField("Title", "title", cfg.title, "e.g. Living Room"));
    row1.appendChild(this._textField("Icon",  "icon",  cfg.icon,  "e.g. mdi:home"));
    wrap.appendChild(row1);

    wrap.appendChild(this._toggleRow("Collapsible header", "collapsible", cfg.collapsible));
    if (cfg.collapsible) {
      wrap.appendChild(this._toggleRow("Default open", "default_open", cfg.default_open));
    }

    // ── SPACING ───────────────────────────────────────────────────
    wrap.appendChild(this._sectionTitle("Spacing"));
    wrap.appendChild(this._sliderField("Padding",       "padding", cfg.padding, 0, 48));
    wrap.appendChild(this._sliderField("Corner radius", "radius",  cfg.radius,  0, 40));
    wrap.appendChild(this._sliderField("Gap",           "gap",     cfg.gap,     0, 40));

    // ── CHILD CARDS ───────────────────────────────────────────────
    wrap.appendChild(this._sectionTitle("Child Cards"));

    var list = this._el("div", "cards-list");
    wrap.appendChild(list);

    cfg.cards.forEach(function(card, idx) {
      list.appendChild(this._cardItem(card, idx, cfg.cards.length));
      if (this._editingIdx === idx) {
        list.appendChild(this._yamlEditor(idx));
      }
    }.bind(this));

    // "New" YAML editor
    if (this._editingIdx === "new") {
      wrap.appendChild(this._yamlEditor("new"));
    } else {
      var addBtn = this._el("button", "add-card-btn");
      addBtn.innerHTML = svgIcon("add") + " &nbsp;Add child card";
      addBtn.addEventListener("click", function() {
        this._editingIdx = "new";
        this._buildContent();
      }.bind(this));
      wrap.appendChild(addBtn);
    }

    // Note
    var note = this._el("p", "note");
    note.textContent = "Child cards are configured as YAML. " +
      "Use any valid Lovelace card config including custom: cards.";
    wrap.appendChild(note);
  }

  // ── Card list item ───────────────────────────────────────────────
  _cardItem(card, idx, total) {
    var item = this._el("div", "card-item");

    var badge = this._el("span", "card-item-badge");
    badge.textContent = idx + 1;
    item.appendChild(badge);

    var label = this._el("span", "card-item-label");
    label.title = card.type || "";
    label.textContent = (card.title || card.name || card.type || "card") +
      (card.entity ? " · " + card.entity : "");
    item.appendChild(label);

    // Move up
    if (idx > 0) {
      var up = this._iconBtn("up", "Move up");
      up.addEventListener("click", function() {
        var c = this._config.cards;
        var tmp = c[idx-1]; c[idx-1] = c[idx]; c[idx] = tmp;
        if (this._editingIdx === idx) this._editingIdx = idx - 1;
        else if (this._editingIdx === idx - 1) this._editingIdx = idx;
        this._fire(); this._buildContent();
      }.bind(this));
      item.appendChild(up);
    }

    // Move down
    if (idx < total - 1) {
      var dn = this._iconBtn("down", "Move down");
      dn.addEventListener("click", function() {
        var c = this._config.cards;
        var tmp = c[idx]; c[idx] = c[idx+1]; c[idx+1] = tmp;
        if (this._editingIdx === idx) this._editingIdx = idx + 1;
        else if (this._editingIdx === idx + 1) this._editingIdx = idx;
        this._fire(); this._buildContent();
      }.bind(this));
      item.appendChild(dn);
    }

    // Edit YAML
    var ed = this._iconBtn("edit", "Edit YAML");
    if (this._editingIdx === idx) ed.classList.add("active");
    ed.addEventListener("click", function() {
      this._editingIdx = (this._editingIdx === idx) ? null : idx;
      this._buildContent();
    }.bind(this));
    item.appendChild(ed);

    // Delete
    var del = this._iconBtn("delete", "Remove");
    del.classList.add("danger");
    del.addEventListener("click", function() {
      this._config.cards.splice(idx, 1);
      if (this._editingIdx === idx) this._editingIdx = null;
      this._fire(); this._buildContent();
    }.bind(this));
    item.appendChild(del);

    return item;
  }

  // ── Inline YAML editor ───────────────────────────────────────────
  _yamlEditor(idx) {
    var isNew   = idx === "new";
    var current = isNew ? { type: "entities", entities: [] } : this._config.cards[idx];
    var area    = this._el("div", "yaml-area open");

    var ta = document.createElement("textarea");
    ta.spellcheck = false;
    ta.placeholder = "type: entities\nentities:\n  - sun.sun";
    ta.value = toYaml(current);
    area.appendChild(ta);

    var errEl = this._el("div", "yaml-error");
    errEl.style.display = "none";
    area.appendChild(errEl);

    var actions = this._el("div", "yaml-actions");

    var cancelBtn = this._el("button", "yaml-btn");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", function() {
      this._editingIdx = null;
      this._buildContent();
    }.bind(this));
    actions.appendChild(cancelBtn);

    var saveBtn = this._el("button", "yaml-btn primary");
    saveBtn.textContent = isNew ? "Add Card" : "Save";
    saveBtn.addEventListener("click", function() {
      try {
        errEl.style.display = "none";
        var parsed = fromYaml(ta.value);
        if (!parsed.type) throw new Error("Missing required field: type");
        if (isNew) { this._config.cards.push(parsed); }
        else        { this._config.cards[idx] = parsed; }
        this._editingIdx = null;
        this._fire();
        this._buildContent();
      } catch(e) {
        errEl.textContent = "Error: " + e.message;
        errEl.style.display = "block";
      }
    }.bind(this));
    actions.appendChild(saveBtn);

    area.appendChild(actions);
    return area;
  }

  // ── DOM helpers ──────────────────────────────────────────────────
  _el(tag, cls) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    return el;
  }

  _sectionTitle(text) {
    var el = this._el("div", "section-title");
    el.textContent = text;
    return el;
  }

  _fieldWrap(label, control) {
    var wrap = this._el("div", "nm-field");
    if (label) {
      var lbl = document.createElement("label");
      lbl.textContent = label;
      wrap.appendChild(lbl);
    }
    wrap.appendChild(control);
    return wrap;
  }

  _textField(label, key, value, placeholder) {
    var inp = document.createElement("input");
    inp.type = "text";
    inp.value = value || "";
    if (placeholder) inp.placeholder = placeholder;
    inp.addEventListener("change", function() {
      this._config[key] = inp.value.trim() || "";
      this._fire();
    }.bind(this));
    return this._fieldWrap(label, inp);
  }

  _sliderField(label, key, value, min, max) {
    var wrap = this._el("div", "nm-field");
    var lbl = document.createElement("label");
    lbl.textContent = label;
    wrap.appendChild(lbl);

    var row = this._el("div", "nm-slider-row");
    var sl  = document.createElement("input");
    sl.type = "range"; sl.min = min; sl.max = max; sl.value = value;
    var val = this._el("span", "nm-slider-val");
    val.textContent = value + "px";

    sl.addEventListener("input", function() {
      var n = Number(sl.value);
      this._config[key] = n;
      val.textContent = n + "px";
      this._fire();
    }.bind(this));

    row.appendChild(sl);
    row.appendChild(val);
    wrap.appendChild(row);
    return wrap;
  }

  _toggleRow(label, key, value) {
    var wrap = this._el("div", "nm-toggle-row");
    var lbl  = this._el("span", "nm-toggle-label");
    lbl.textContent = label;
    wrap.appendChild(lbl);

    var sw    = this._el("label", "nm-switch");
    var inp   = document.createElement("input");
    inp.type  = "checkbox";
    inp.checked = !!value;
    var track = this._el("span", "track");
    var thumb = this._el("span", "thumb");

    inp.addEventListener("change", function() {
      this._config[key] = inp.checked;
      this._fire();
      if (key === "collapsible") this._buildContent();
    }.bind(this));

    sw.appendChild(inp);
    sw.appendChild(track);
    sw.appendChild(thumb);
    wrap.appendChild(sw);
    return wrap;
  }

  _iconBtn(icon, title) {
    var btn = this._el("button", "icon-btn");
    btn.title = title;
    btn.innerHTML = svgIcon(icon);
    return btn;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN CARD ELEMENT
// ═══════════════════════════════════════════════════════════════════
class NeumorphicContainerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass   = null;
    this._cards  = [];
    this._open   = true;
  }

  static getConfigElement() {
    return document.createElement(EDITOR_TAG);
  }

  static getStubConfig() {
    return {
      title: "My Section",
      icon:  "mdi:home",
      style: "raised",
      columns: 1,
      collapsible: true,
      cards: [{ type: "entities", entities: ["sun.sun"] }],
    };
  }

  setConfig(config) {
    if (!config.cards || !Array.isArray(config.cards)) {
      throw new Error("neumorphic-container-card: 'cards' must be a list.");
    }
    this._config = {
      style:        config.style        !== undefined ? config.style        : "raised",
      title:        config.title        !== undefined ? config.title        : null,
      icon:         config.icon         !== undefined ? config.icon         : null,
      padding:      config.padding      !== undefined ? config.padding      : 16,
      radius:       config.radius       !== undefined ? config.radius       : 16,
      gap:          config.gap          !== undefined ? config.gap          : 12,
      columns:      config.columns      !== undefined ? config.columns      : 1,
      collapsible:  config.collapsible  !== undefined ? config.collapsible  : false,
      default_open: config.default_open !== undefined ? config.default_open : true,
      cards:        config.cards,
    };
    this._open = this._config.default_open;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    this._cards.forEach(function(c) {
      if (c && "hass" in c) c.hass = hass;
    });
  }

  _build() {
    if (!this._config.cards) return;
    var cfg  = this._config;
    var root = this.shadowRoot;
    root.innerHTML = "";

    var style = document.createElement("style");
    style.textContent = CARD_STYLES;
    root.appendChild(style);

    var container = document.createElement("div");
    container.className = "nm-container style-" + cfg.style;
    container.style.setProperty("--nm-radius",  cfg.radius  + "px");
    container.style.setProperty("--nm-padding", cfg.padding + "px");
    container.style.setProperty("--nm-gap",     cfg.gap     + "px");
    container.style.setProperty("--nm-cols",    String(cfg.columns || 1));

    // Header
    if (cfg.title || cfg.icon || cfg.collapsible) {
      var header = document.createElement("div");
      header.className = "nm-header" + (cfg.collapsible ? " clickable" : "");

      if (cfg.icon) {
        var iw = document.createElement("span");
        iw.className = "nm-header-icon";
        var haIcon = document.createElement("ha-icon");
        haIcon.setAttribute("icon", cfg.icon);
        iw.appendChild(haIcon);
        header.appendChild(iw);
      }

      if (cfg.title) {
        var titleEl = document.createElement("span");
        titleEl.className = "nm-header-title";
        titleEl.textContent = cfg.title;
        header.appendChild(titleEl);
      }

      if (cfg.collapsible) {
        var tog = document.createElement("span");
        tog.className = "nm-header-toggle" + (this._open ? "" : " collapsed");
        tog.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="' + SVG_PATHS.chevron + '"/></svg>';
        this._toggleEl = tog;
        header.appendChild(tog);
        header.addEventListener("click", this._toggleCollapse.bind(this));
      }

      container.appendChild(header);
    }

    // Cards
    var cardsEl = document.createElement("div");
    cardsEl.className = "nm-cards" + (this._open ? "" : " collapsed");
    this._cardsEl = cardsEl;

    this._cards = [];
    cfg.cards.forEach(function(cardCfg) {
      var wrap = document.createElement("div");
      wrap.className = "nm-child-wrap";
      var card = this._createCard(cardCfg);
      if (card) {
        wrap.appendChild(card);
        this._cards.push(card);
      }
      cardsEl.appendChild(wrap);
    }.bind(this));

    container.appendChild(cardsEl);
    root.appendChild(container);
  }

  _createCard(cfg) {
    var type = cfg.type || "";

    // Custom card
    if (type.indexOf("custom:") === 0) {
      var tag = type.slice(7);
      try {
        var el = document.createElement(tag);
        if (el && el.setConfig) {
          el.setConfig(cfg);
          if (this._hass) el.hass = this._hass;
        }
        return el;
      } catch(_) {}
    }

    // Built-in card
    try {
      var bi = document.createElement("hui-" + type + "-card");
      if (bi) {
        if (bi.setConfig) bi.setConfig(cfg);
        if (this._hass) bi.hass = this._hass;
        return bi;
      }
    } catch(_) {}

    // Fallback
    var ph = document.createElement("div");
    ph.style.cssText = "padding:12px;opacity:.5;font-size:.85rem";
    ph.textContent = "Card: " + type;
    return ph;
  }

  _toggleCollapse() {
    this._open = !this._open;
    if (this._cardsEl) this._cardsEl.classList.toggle("collapsed", !this._open);
    if (this._toggleEl) this._toggleEl.classList.toggle("collapsed", !this._open);
  }

  getCardSize() {
    return this._cards.reduce(function(acc, c) {
      return acc + (c && c.getCardSize ? c.getCardSize() : 1);
    }, 0);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  REGISTER ELEMENTS
// ═══════════════════════════════════════════════════════════════════
if (!customElements.get(EDITOR_TAG)) {
  customElements.define(EDITOR_TAG, NeumorphicContainerCardEditor);
}
if (!customElements.get("neumorphic-container-card")) {
  customElements.define("neumorphic-container-card", NeumorphicContainerCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type:        "neumorphic-container-card",
  name:        "Neumorphic Container Card",
  preview:     false,
  description: "A neumorphic-styled container that wraps other Lovelace cards.",
  version:     VERSION,
});

console.info(
  "%c NEUMORPHIC-CONTAINER-CARD %c v" + VERSION + " ",
  "background:#6c8ebf;color:#fff;font-weight:bold;border-radius:4px 0 0 4px;padding:2px 6px",
  "background:#e0e5ec;color:#44506a;font-weight:bold;border-radius:0 4px 4px 0;padding:2px 6px"
);
