/**
 * Neumorphic Time Picker Card
 *
 * type: custom:timepicker-card
 * entity: input_datetime.alarm
 * am_pm: true                  # false = 24h (default), true = 12h with AM/PM toggle
 * label_major:
 *   text: Alarm
 *   position: top              # top | bottom | left | right | none
 *   font: ""                   # blank = Nunito
 *   size: 0.78rem
 *   weight: 800
 *   spacing: 0.18em
 *   transform: uppercase       # none | uppercase | lowercase | capitalize | full-width
 *   color: ""                  # blank = theme muted
 * label_minor:
 *   text: Morning routine
 *   position: bottom
 *   font: ""; size: 0.62rem; weight: 600; spacing: 0.06em; transform: none; color: ""
 * value:
 *   font: ""; size: 1.1rem; weight: 900; spacing: 1px; transform: none; color: ""
 * ampm:                        # style for the AM/PM badge (only used when am_pm: true)
 *   font: ""; size: 0.55rem; weight: 800; spacing: 0.08em; transform: uppercase; color: ""
 * icon:
 *   name: mdi:alarm; position: left; size: 1.4rem; color: ""
 */

/* ─────────────────────────────────────────────────────
   SHARED EDITOR BASE
───────────────────────────────────────────────────── */
class NeuCardEditorBase extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode:"open" }); this._config = {}; this._hass = null; }
  setConfig(c) { this._config = JSON.parse(JSON.stringify(c)); this._render(); }
  set hass(h){
    const first = !this._hass;
    this._hass = h;
    const ep = this.shadowRoot && this.shadowRoot.getElementById("entity_picker");
    if (ep) ep.hass = h;
    if (first && this.shadowRoot && this.shadowRoot.childNodes.length) this._render();
  }
  /* entity picker: native ha-entity-picker (optionally domain-filtered) or text fallback */
  _entityPicker(placeholder, domain){
    const v = this._get("entity");
    if (customElements.get("ha-entity-picker")) {
      const inc = domain ? ` include-domains='["${domain}"]'` : "";
      return `<ha-entity-picker id="entity_picker" data-path="entity" .value="${v}" value="${v}"${inc} allow-custom-entity></ha-entity-picker>`;
    }
    return this._inp("entity", placeholder);
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed",{ detail:{ config:this._config }, bubbles:true, composed:true })); }
  _set(path, value) {
    const parts=path.split("."); let obj=this._config;
    while(parts.length>1){const k=parts.shift();if(!obj[k])obj[k]={};obj=obj[k];}
    obj[parts[0]]=value; this._fire(); this._render();
  }
  _get(path, def="") {
    const parts=path.split("."); let obj=this._config;
    for(const k of parts){if(obj==null)return def;obj=obj[k];}
    return obj??def;
  }
  static get FONTS(){return[["","Default"],["'Space Mono',monospace","Space Mono"],["'JetBrains Mono',monospace","JetBrains Mono"],["'Nunito',sans-serif","Nunito"],["'Roboto',sans-serif","Roboto"],["'Open Sans',sans-serif","Open Sans"],["'Lato',sans-serif","Lato"],["'Raleway',sans-serif","Raleway"],["'Montserrat',sans-serif","Montserrat"],["'Oswald',sans-serif","Oswald"],["'Playfair Display',serif","Playfair Display"],["'Merriweather',serif","Merriweather"],["'Source Code Pro',monospace","Source Code Pro"],["'DM Sans',sans-serif","DM Sans"],["'Quicksand',sans-serif","Quicksand"]];}
  static get POS(){return["top","bottom","left","right","none"];}
  static get WEIGHTS(){return["400","500","600","700","800","900"];}
  static get TRANSFORMS(){return["none","uppercase","lowercase","capitalize","full-width"];}

  _sel(path,opts,labels){const cur=this._get(path,opts[0]);return`<select data-path="${path}">${opts.map((o,i)=>`<option value="${o}"${o===cur?" selected":""}>${labels?labels[i]:o}</option>`).join("")}</select>`;}
  _inp(path,ph="",type="text"){return`<input type="${type}" data-path="${path}" value="${this._get(path)}" placeholder="${ph}"/>`;}
  _colorRow(path){const cur=this._get(path,"")||"#8fa0b8";return`<input type="color" data-path="${path}" value="${cur}"/><input type="text" data-path="${path}" value="${this._get(path)}" placeholder="blank = theme"/>`;}
  _fontSel(path){return this._sel(path,NeuCardEditorBase.FONTS.map(f=>f[0]),NeuCardEditorBase.FONTS.map(f=>f[1]));}
  _section(title,...rows){return`<div class="section"><div class="section-title">${title}</div>${rows.join("")}</div>`;}
  _row(label,content){return`<div class="row"><label>${label}</label><div class="ctrl">${content}</div></div>`;}
  _typoRows(key){return[
    this._row("Font",      this._fontSel(`${key}.font`)),
    this._row("Size",      this._inp(`${key}.size`,"1rem")),
    this._row("Weight",    this._sel(`${key}.weight`,NeuCardEditorBase.WEIGHTS)),
    this._row("Spacing",   this._inp(`${key}.spacing`,"0em")),
    this._row("Transform", this._sel(`${key}.transform`,NeuCardEditorBase.TRANSFORMS)),
    this._row("Color",     this._colorRow(`${key}.color`)),
  ];}
  _labelSection(key,title,ph){return this._section(title,this._row("Text",this._inp(`${key}.text`,ph)),this._row("Position",this._sel(`${key}.position`,NeuCardEditorBase.POS)),...this._typoRows(key));}
  _valueSection(key="value",title="Value Display"){return this._section(title,...this._typoRows(key));}
  _iconSection(hint){return this._section("Icon",this._row("MDI Icon",this._inp("icon.name","mdi:alarm")),`<div class="hint">${hint}</div>`,this._row("Position",this._sel("icon.position",NeuCardEditorBase.POS)),this._row("Size",this._inp("icon.size","1.4rem")),this._row("Color",this._colorRow("icon.color")));}
  _editorCSS(){return`<style>
    :host{display:block;font-family:'Segoe UI',sans-serif;font-size:13px;color:#2d3a52;}
    .editor{display:flex;flex-direction:column;gap:16px;padding:4px 0;}
    .section{background:#f0f3f7;border-radius:12px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;}
    .section-title{font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#8fa0b8;margin-bottom:2px;}
    .row{display:grid;grid-template-columns:120px 1fr;align-items:center;gap:8px;}
    label{font-size:.78rem;font-weight:600;color:#5a6a80;white-space:nowrap;}
    .ctrl{display:flex;align-items:center;gap:6px;}
    input,select{width:100%;padding:6px 10px;border:1.5px solid #d0d8e8;border-radius:8px;background:#fff;font-family:inherit;font-size:.8rem;color:#2d3a52;outline:none;transition:border-color .15s;box-sizing:border-box;}
    input:focus,select:focus{border-color:#5b8dee;}
    input[type=color]{padding:2px 4px;width:44px;min-width:44px;height:32px;cursor:pointer;}
    input[type=color]+input[type=text]{flex:1;}
    input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#5b8dee;}
    input[type=number]{-moz-appearance:textfield;}
    .hint{font-size:.68rem;color:#aab8cc;margin-top:-4px;grid-column:1/-1;}
    ha-entity-picker{display:block;width:100%;}
  </style>`;}
  _bindInputs(){
    const ep = this.shadowRoot.getElementById("entity_picker");
    if (ep) {
      ep.hass = this._hass;
      ep.addEventListener("value-changed", (e) => { this._set("entity", e.detail.value); });
    }
    this.shadowRoot.querySelectorAll("[data-path]").forEach(el=>{
      if (el.id === "entity_picker") return; // handled above
      const update=e=>{
        const val=el.type==="checkbox"?String(el.checked):el.value;
        this._set(el.dataset.path,val);
      };
      el.addEventListener("change",update);
      if(el.tagName==="INPUT"&&el.type!=="color"&&el.type!=="checkbox")
        el.addEventListener("input",update);
    });
  }
}

/* ─────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────── */
function _typoStyle(cfg,defaults={}){
  return[
    (cfg?.font    ||defaults.font)    ?`font-family:${cfg?.font    ||defaults.font}`:"",
    (cfg?.size    ||defaults.size)    ?`font-size:${cfg?.size      ||defaults.size}`:"",
    (cfg?.weight  ||defaults.weight)  ?`font-weight:${cfg?.weight  ||defaults.weight}`:"",
    (cfg?.spacing ||defaults.spacing) ?`letter-spacing:${cfg?.spacing||defaults.spacing}`:"",
    (cfg?.transform&&cfg.transform!=="none")?`text-transform:${cfg.transform}`:"",
    (cfg?.color   ||defaults.color)   ?`color:${cfg?.color         ||defaults.color}`:"",
  ].filter(Boolean).join(";");
}

/* ─────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────── */
class TimepickerCard extends HTMLElement {
  constructor(){
    super(); this.attachShadow({mode:"open"});
    this._config={}; this._hass=null;
    this._h=new Date().getHours(); this._m=new Date().getMinutes();
    this._pm=this._h>=12;          // tracks AM/PM in 12h mode
    this._expanded=false; this._active=null; this._rendered=false;
  }

  static getConfigElement(){return document.createElement("timepicker-card-editor");}
  static getStubConfig(){return{
    entity:"", am_pm:false, hide_border:false,
    label_major:{text:"Time", position:"top",    font:"",size:"0.78rem",weight:"800",spacing:"0.18em",transform:"uppercase",color:""},
    label_minor:{text:"",     position:"bottom", font:"",size:"0.62rem",weight:"600",spacing:"0.06em",transform:"none",     color:""},
    value:      {             font:"",size:"1.1rem", weight:"900",spacing:"1px",   transform:"none",     color:""},
    ampm:       {             font:"",size:"0.55rem",weight:"800",spacing:"0.08em",transform:"uppercase",color:""},
    icon:       {name:"",     position:"none",   size:"1.4rem",color:""},
  };}

  setConfig(c){this._config=c;if(this._rendered){this._teardown();this._rendered=false;}}
  set hass(h){this._hass=h;if(!this._rendered){this._render();this._rendered=true;}this._syncEntity();this._watchHass();}
  getCardSize(){return 3;}

  _pad(n){return String(n).padStart(2,"0");}
  _is12h(){return this._config.am_pm===true||this._config.am_pm==="true";}

  _angleFrom(e,el){
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const px=e.touches?e.touches[0].clientX:e.clientX,py=e.touches?e.touches[0].clientY:e.clientY;
    let a=Math.atan2(py-cy,px-cx)*180/Math.PI+90;return a<0?a+360:a;
  }
  _radiusRatio(e,el){
    const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const px=e.touches?e.touches[0].clientX:e.clientX,py=e.touches?e.touches[0].clientY:e.clientY;
    return Math.sqrt((px-cx)**2+(py-cy)**2)/(r.width/2);
  }
  _teardown(){
    if(this._mv){window.removeEventListener("mousemove",this._mv);window.removeEventListener("touchmove",this._mv);}
    if(this._up){window.removeEventListener("mouseup",this._up);window.removeEventListener("touchend",this._up);}
  }

  _syncEntity(){
    if(!this._config.entity||!this._hass)return;
    const s=this._hass.states[this._config.entity];
    if(!s||s.state==="unavailable")return;
    const p=s.state.split(":");
    this._h=parseInt(p[0],10); this._m=parseInt(p[1],10);
    this._pm=this._h>=12;
    this._redraw();
  }

  _watchHass(){
    // no extra entity to watch for time card — placeholder for consistency
  }

  _saveEntity(){
    if(!this._config.entity||!this._hass)return;
    this._hass.callService("input_datetime","set_datetime",{
      entity_id:this._config.entity,
      time:`${this._pad(this._h)}:${this._pad(this._m)}:00`,
    });
  }

  _iconEl(name,size,color){
    if(!name)return"";
    return`<ha-icon icon="${name}" style="--mdc-icon-size:${size};color:${color||"var(--muted)"};display:flex;align-items:center;"></ha-icon>`;
  }
  _labelHTML(cfgL,cls){
    const pos=cfgL?.position||"none";
    if(pos==="none"||!cfgL?.text)return{pos,html:""};
    return{pos,html:`<span class="${cls}" style="${_typoStyle(cfgL)}">${cfgL.text}</span>`};
  }

  /* ── render ── */
  _render(){
    const cfg=this._config,lma=cfg.label_major||{},lmi=cfg.label_minor||{},ico=cfg.icon||{};
    const slots={top:[],bottom:[],left:[],right:[]};
    const push=(pos,html)=>{if(pos&&pos!=="none"&&html&&slots[pos])slots[pos].push(html);};
    const ma=this._labelHTML(lma,"lbl-major");push(ma.pos,ma.html);
    const mi=this._labelHTML(lmi,"lbl-minor");push(mi.pos,mi.html);
    if(ico.name&&ico.position&&ico.position!=="none")
      push(ico.position,this._iconEl(ico.name,ico.size||"1.4rem",ico.color||""));
    const sh=a=>a.join("");
    const valSty=_typoStyle(cfg.value||{},{size:"1.1rem",weight:"900",spacing:"1px"});
    const ampmSty=_typoStyle(cfg.ampm||{},{size:"0.55rem",weight:"800",spacing:"0.08em",transform:"uppercase"});
    const is12=this._is12h();
    const hideBorder=cfg.hide_border===true||cfg.hide_border==="true";

    this.shadowRoot.innerHTML=`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
      :host{display:block;}
      .card{
        --bg:#E7E5E4;--light:#ffffff;--sh:#c5c3c2;--text:#1E2938;--muted:#8fa0b8;
        --rh:#9aafc8;--rm:#b0a8c0;
        background:${hideBorder?"transparent":"var(--bg)"};border-radius:28px;
        box-shadow:${hideBorder?"none":"10px 10px 26px var(--sh),-10px -10px 26px var(--light)"};
        padding:${hideBorder?"0":"26px 18px 30px"};
        display:grid;grid-template-areas:"top""mid""bot";grid-template-rows:auto 1fr auto;
        align-items:center;justify-items:center;gap:10px;font-family:'Space Mono','Segoe UI',monospace;
      }
      .s-top{grid-area:top;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;min-height:4px;}
      .s-bot{grid-area:bot;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;min-height:4px;}
      .mid{grid-area:mid;display:flex;align-items:center;justify-content:center;gap:14px;}
      .s-left{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:4px;}
      .s-right{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:4px;}
      .lbl-major{font-size:.78rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
      .lbl-minor{font-size:.62rem;font-weight:600;letter-spacing:.08em;color:var(--muted);opacity:.8;}
      .stage{position:relative;width:240px;height:240px;touch-action:none;flex-shrink:0;}
      .ring{position:absolute;border-radius:50%;background:var(--bg);top:50%;left:50%;transform:translate(-50%,-50%) scale(0);opacity:0;pointer-events:none;transition:transform .6s cubic-bezier(.34,1.28,.64,1),opacity .45s ease;}
      .ring.on{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:all;cursor:grab;}
      .ring.on:active{cursor:grabbing;}
      .rm{width:240px;height:240px;box-shadow:9px 9px 22px var(--sh),-9px -9px 22px var(--light);transition-delay:0s;}
      .rh{width:160px;height:160px;box-shadow:6px 6px 14px var(--sh),-6px -6px 14px var(--light),inset 2px 2px 5px var(--light),inset -2px -2px 5px var(--sh);z-index:2;transition-delay:.08s;}
      /* cap: stacked layout when am_pm on, centred when off */
      .cap{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:90px;height:90px;border-radius:50%;background:var(--bg);box-shadow:inset 5px 5px 12px var(--sh),inset -5px -5px 12px var(--light);z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;user-select:none;transition:box-shadow .2s;}
      .cap:active{box-shadow:inset 3px 3px 7px var(--sh),inset -3px -3px 7px var(--light);}
      .val{pointer-events:none;line-height:1;color:var(--text);}
      /* AM/PM badge — neumorphic pill, tappable */
      .ampm-badge{
        pointer-events:all;
        line-height:1;color:var(--muted);
        background:var(--bg);
        border-radius:20px;
        padding:2px 7px;
        box-shadow:2px 2px 5px var(--sh),-2px -2px 5px var(--light);
        cursor:pointer;
        transition:box-shadow .15s,color .15s;
        display:${is12?"flex":"none"};
        align-items:center;
      }
      .ampm-badge.is-pm{color:var(--rh);}
      .ampm-badge:active{box-shadow:inset 1px 1px 3px var(--sh),inset -1px -1px 3px var(--light);}
      svg.ov{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:9;opacity:0;transition:opacity .4s ease .2s;}
      svg.ov.on{opacity:1;}
      .lh{stroke:var(--rh);stroke-width:2.5;stroke-linecap:round;opacity:.8;}
      .lm{stroke:var(--rm);stroke-width:2.5;stroke-linecap:round;opacity:.8;}
      .th{stroke:var(--rh);stroke-width:1;opacity:.3;}
      .tm{stroke:var(--rm);stroke-width:1;opacity:.3;}
    </style>
    <div class="card">
      <div class="s-top">${sh(slots.top)}</div>
      <div class="mid">
        <div class="s-left">${sh(slots.left)}</div>
        <div class="stage" id="stage">
          <div class="ring rm" id="RM"></div>
          <div class="ring rh" id="RH"></div>
          <svg class="ov" id="SV" viewBox="0 0 240 240">
            <g id="TM"></g><g id="TH"></g>
            <line class="lh" id="LH" x1="120" y1="74" x2="120" y2="46"/>
            <line class="lm" id="LM" x1="120" y1="2"  x2="120" y2="22"/>
          </svg>
          <div class="cap" id="cap">
            <span class="val"        id="TD"   style="${valSty}">00:00</span>
            <span class="ampm-badge" id="AMPM" style="${ampmSty}">AM</span>
          </div>
        </div>
        <div class="s-right">${sh(slots.right)}</div>
      </div>
      <div class="s-bot">${sh(slots.bottom)}</div>
    </div>`;

    this._drawTicks();
    this._redraw();
    this._bindEvents();
  }

  _drawTicks(){
    const sh=this.shadowRoot,cx=120,cy=120;
    const mk=(g,rad,r1,r2,sw,cls)=>{
      const l=document.createElementNS("http://www.w3.org/2000/svg","line");
      l.setAttribute("x1",cx+r1*Math.cos(rad));l.setAttribute("y1",cy+r1*Math.sin(rad));
      l.setAttribute("x2",cx+r2*Math.cos(rad));l.setAttribute("y2",cy+r2*Math.sin(rad));
      l.setAttribute("stroke-width",sw);l.setAttribute("class",cls);g.appendChild(l);
    };
    const gm=sh.getElementById("TM");
    for(let i=0;i<60;i++){const rad=(i/60*360-90)*Math.PI/180,maj=i%5===0;mk(gm,rad,maj?113:116,119,maj?2:1,"tm");}
    const gh=sh.getElementById("TH");
    // in 12h mode draw 12 ticks, in 24h mode draw 24
    const hCount=this._is12h()?12:24;
    for(let i=0;i<hCount;i++)mk(gh,(i/hCount*360-90)*Math.PI/180,73,79,i===0?3:2,"th");
  }

  _redraw(){
    const sh=this.shadowRoot,cx=120,cy=120;
    const is12=this._is12h();
    const display12=is12?(this._h%12||12):this._h;
    const hForDisplay=is12?display12:this._h;

    // time text
    const td=sh.getElementById("TD");
    if(td) td.textContent=`${this._pad(hForDisplay)}:${this._pad(this._m)}`;

    // AM/PM badge
    const ap=sh.getElementById("AMPM");
    if(ap){
      ap.textContent=this._pm?"PM":"AM";
      ap.classList.toggle("is-pm",this._pm);
      ap.style.display=is12?"flex":"none";
    }

    // hour hand angle — always based on 12h cycle for visual
    const hFrac=is12?(this._h%12)/12:this._h/24;
    const hRad=(hFrac*360-90)*Math.PI/180;
    const lh=sh.getElementById("LH");
    if(lh){lh.setAttribute("x1",cx+46*Math.cos(hRad));lh.setAttribute("y1",cy+46*Math.sin(hRad));
            lh.setAttribute("x2",cx+78*Math.cos(hRad));lh.setAttribute("y2",cy+78*Math.sin(hRad));}

    // minute hand
    const mRad=(this._m/60*360-90)*Math.PI/180;
    const lm=sh.getElementById("LM");
    if(lm){lm.setAttribute("x1",cx+82*Math.cos(mRad));lm.setAttribute("y1",cy+82*Math.sin(mRad));
            lm.setAttribute("x2",cx+118*Math.cos(mRad));lm.setAttribute("y2",cy+118*Math.sin(mRad));}
  }

  _expand(){const sh=this.shadowRoot;this._expanded=true;sh.getElementById("RM")?.classList.add("on");sh.getElementById("RH")?.classList.add("on");sh.getElementById("SV")?.classList.add("on");}
  _collapse(){const sh=this.shadowRoot;this._expanded=false;this._active=null;sh.getElementById("RM")?.classList.remove("on");sh.getElementById("RH")?.classList.remove("on");sh.getElementById("SV")?.classList.remove("on");this._saveEntity();}

  _toggleAmPm(){
    this._pm=!this._pm;
    // shift hour by ±12
    if(this._pm)  { if(this._h<12)  this._h+=12; }
    else          { if(this._h>=12) this._h-=12; }
    this._redraw();
  }

  _bindEvents(){
    const sh=this.shadowRoot,stage=sh.getElementById("stage"),cap=sh.getElementById("cap");

    // cap click: toggle expand, but if clicking badge toggle AM/PM instead
    cap.addEventListener("click",e=>{
      e.stopPropagation();
      // check if badge was the target
      const badge=sh.getElementById("AMPM");
      if(badge&&badge.contains(e.composedPath?.()?.[0]||e.target)){
        this._toggleAmPm(); return;
      }
      this._expanded?this._collapse():this._expand();
    });

    // separate direct listener on badge for safety
    sh.getElementById("AMPM")?.addEventListener("click",e=>{
      e.stopPropagation(); this._toggleAmPm();
    });

    const onStart=e=>{
      if(!this._expanded)return;
      const r=this._radiusRatio(e,stage);if(r<0.22)return;
      this._active=r>0.5?"m":"h"; e.preventDefault();
    };
    this._mv=e=>{
      if(!this._active)return; e.preventDefault();
      const a=this._angleFrom(e,stage);
      if(this._active==="m"){
        this._m=Math.round(a/360*60)%60;
      } else {
        if(this._is12h()){
          // map angle → 1–12 then apply PM offset
          const raw=Math.round(a/360*12)%12||12; // 0→12
          this._h=(raw%12)+(this._pm?12:0);      // 12AM→0, 12PM→12
        } else {
          const raw24=Math.round(a/360*24)%24;
          this._h=raw24;
          this._pm=this._h>=12;
        }
      }
      this._redraw();
    };
    this._up=()=>{this._active=null;};
    stage.addEventListener("mousedown",onStart);
    stage.addEventListener("touchstart",onStart,{passive:false});
    window.addEventListener("mousemove",this._mv);
    window.addEventListener("touchmove",this._mv,{passive:false});
    window.addEventListener("mouseup",this._up);
    window.addEventListener("touchend",this._up);
  }
}

customElements.define("timepicker-card",TimepickerCard);

/* ─────────────────────────────────────────────────────
   EDITOR
───────────────────────────────────────────────────── */
class TimepickerCardEditor extends NeuCardEditorBase {
  _render(){
    const amPmOn=this._get("am_pm","false");
    const showAmPm=amPmOn===true||amPmOn==="true";
    this.shadowRoot.innerHTML=`
      ${this._editorCSS()}
      <div class="editor">
        ${this._section("Entity & Mode",
          this._row("Entity",      this._entityPicker("input_datetime.my_time","input_datetime")),
          this._row("12h Mode",    `<input type="checkbox" data-path="am_pm"${showAmPm?" checked":""}/>`),
          this._row("Hide Border", `<input type="checkbox" data-path="hide_border"${this._get("hide_border")==="true"||this._get("hide_border")===true?" checked":""}/>`)
        )}
        ${this._labelSection("label_major","Major Label","e.g. Alarm")}
        ${this._labelSection("label_minor","Minor Label","e.g. Morning routine")}
        ${this._valueSection("value","Value Display")}
        ${showAmPm?this._valueSection("ampm","AM / PM Badge"):""}
        ${this._iconSection("mdi:alarm · mdi:clock-outline · mdi:bell · mdi:coffee")}
      </div>`;
    this._bindInputs();
  }
}

customElements.define("timepicker-card-editor",TimepickerCardEditor);

window.customCards=window.customCards||[];
window.customCards.push({type:"timepicker-card",name:"Neumorphic Time Picker",description:"Expanding-ring neumorphic time picker with AM/PM.",preview:true});
