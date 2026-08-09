/**
 * Neumorphic Date Picker Card
 *
 * type: custom:datepicker-card
 * entity: input_datetime.my_date
 * year_min: 2020
 * year_max: 2035
 * holiday_entity: binary_sensor.is_holiday   # optional boolean entity
 * holiday_color: "#e07070"                   # cap tint + glow when entity is on
 * label_major: { text, position, font, size, weight, spacing, transform, color }
 * label_minor: { text, position, font, size, weight, spacing, transform, color }
 * value:       { font, size, weight, spacing, transform, color }
 * icon:        { name, position, size, color }
 */

/* ─────────────────────────────────────────────────────
   SHARED EDITOR BASE  (identical to timepicker-card.js)
───────────────────────────────────────────────────── */
class NeuCardEditorBase extends HTMLElement {
  constructor(){super();this.attachShadow({mode:"open"});this._config={};this._hass=null;}
  setConfig(c){this._config=JSON.parse(JSON.stringify(c));this._render();}
  set hass(h){
    const first=!this._hass;
    this._hass=h;
    const ep=this.shadowRoot&&this.shadowRoot.getElementById("entity_picker");
    if(ep)ep.hass=h;
    if(first&&this.shadowRoot&&this.shadowRoot.childNodes.length)this._render();
  }
  _entityPicker(placeholder,domain){
    const v=this._get("entity");
    if(customElements.get("ha-entity-picker")){
      const inc=domain?` include-domains='["${domain}"]'`:"";
      return `<ha-entity-picker id="entity_picker" data-path="entity" .value="${v}" value="${v}"${inc} allow-custom-entity></ha-entity-picker>`;
    }
    return this._inp("entity",placeholder);
  }
  _fire(){this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true}));}
  _set(path,value){const parts=path.split(".");let obj=this._config;while(parts.length>1){const k=parts.shift();if(!obj[k])obj[k]={};obj=obj[k];}obj[parts[0]]=value;this._fire();this._render();}
  _get(path,def=""){const parts=path.split(".");let obj=this._config;for(const k of parts){if(obj==null)return def;obj=obj[k];}return obj??def;}
  static get FONTS(){return[["","Default"],["'Nunito',sans-serif","Nunito"],["'Roboto',sans-serif","Roboto"],["'Open Sans',sans-serif","Open Sans"],["'Lato',sans-serif","Lato"],["'Raleway',sans-serif","Raleway"],["'Montserrat',sans-serif","Montserrat"],["'Oswald',sans-serif","Oswald"],["'Playfair Display',serif","Playfair Display"],["'Merriweather',serif","Merriweather"],["'Source Code Pro',monospace","Source Code Pro"],["'DM Sans',sans-serif","DM Sans"],["'Quicksand',sans-serif","Quicksand"]];}
  static get POS(){return["top","bottom","left","right","none"];}
  static get WEIGHTS(){return["400","500","600","700","800","900"];}
  static get TRANSFORMS(){return["none","uppercase","lowercase","capitalize","full-width"];}
  _sel(path,opts,labels){const cur=this._get(path,opts[0]);return`<select data-path="${path}">${opts.map((o,i)=>`<option value="${o}"${o===cur?" selected":""}>${labels?labels[i]:o}</option>`).join("")}</select>`;}
  _inp(path,ph="",type="text"){return`<input type="${type}" data-path="${path}" value="${this._get(path)}" placeholder="${ph}"/>`;}
  _colorRow(path){const cur=this._get(path,"")||"#8fa0b8";return`<input type="color" data-path="${path}" value="${cur}"/><input type="text" data-path="${path}" value="${this._get(path)}" placeholder="blank = theme"/>`;}
  _fontSel(path){return this._sel(path,NeuCardEditorBase.FONTS.map(f=>f[0]),NeuCardEditorBase.FONTS.map(f=>f[1]));}
  _section(title,...rows){return`<div class="section"><div class="section-title">${title}</div>${rows.join("")}</div>`;}
  _row(label,content){return`<div class="row"><label>${label}</label><div class="ctrl">${content}</div></div>`;}
  _typoRows(key){return[this._row("Font",this._fontSel(`${key}.font`)),this._row("Size",this._inp(`${key}.size`,"1rem")),this._row("Weight",this._sel(`${key}.weight`,NeuCardEditorBase.WEIGHTS)),this._row("Spacing",this._inp(`${key}.spacing`,"0em")),this._row("Transform",this._sel(`${key}.transform`,NeuCardEditorBase.TRANSFORMS)),this._row("Color",this._colorRow(`${key}.color`))];}
  _labelSection(key,title,ph){return this._section(title,this._row("Text",this._inp(`${key}.text`,ph)),this._row("Position",this._sel(`${key}.position`,NeuCardEditorBase.POS)),...this._typoRows(key));}
  _valueSection(key="value",title="Value Display"){return this._section(title,...this._typoRows(key));}
  _iconSection(hint){return this._section("Icon",this._row("MDI Icon",this._inp("icon.name","mdi:calendar")),`<div class="hint">${hint}</div>`,this._row("Position",this._sel("icon.position",NeuCardEditorBase.POS)),this._row("Size",this._inp("icon.size","1.4rem")),this._row("Color",this._colorRow("icon.color")));}
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
    input[type=number]{-moz-appearance:textfield;}
    .hint{font-size:.68rem;color:#aab8cc;margin-top:-4px;grid-column:1/-1;}
    ha-entity-picker{display:block;width:100%;}
  </style>`;}
  _bindInputs(){
    const ep=this.shadowRoot.getElementById("entity_picker");
    if(ep){
      ep.hass=this._hass;
      ep.addEventListener("value-changed",e=>{this._set("entity",e.detail.value);});
    }
    this.shadowRoot.querySelectorAll("[data-path]").forEach(el=>{
      if(el.id==="entity_picker")return;
      const update=e=>{
        const val=el.type==="checkbox"?String(el.checked):el.value;
        this._set(e.target.dataset.path,val);
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
const MONTHS_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function daysInMonth(m,y){return new Date(y,m,0).getDate();}
function clampDay(d,m,y){return Math.min(d,daysInMonth(m,y));}
function _typoStyle(cfg,defaults={}){
  return[(cfg?.font||defaults.font)?`font-family:${cfg?.font||defaults.font}`:"",
    (cfg?.size||defaults.size)?`font-size:${cfg?.size||defaults.size}`:"",
    (cfg?.weight||defaults.weight)?`font-weight:${cfg?.weight||defaults.weight}`:"",
    (cfg?.spacing||defaults.spacing)?`letter-spacing:${cfg?.spacing||defaults.spacing}`:"",
    (cfg?.transform&&cfg.transform!=="none")?`text-transform:${cfg.transform}`:"",
    (cfg?.color||defaults.color)?`color:${cfg?.color||defaults.color}`:"",
  ].filter(Boolean).join(";");
}

/* ─────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────── */
class DatepickerCard extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:"open"});
    this._config={};this._hass=null;
    const now=new Date();
    this._day=now.getDate();this._month=now.getMonth()+1;this._year=now.getFullYear();
    this._holiday=false;
    this._expanded=false;this._active=null;this._rendered=false;
  }

  static getConfigElement(){return document.createElement("datepicker-card-editor");}
  static getStubConfig(){const y=new Date().getFullYear();return{
    entity:"",year_min:y-2,year_max:y+10,
    hide_border:false,
    holiday_entity:"",holiday_color:"#e07070",
    label_major:{text:"Date",position:"top",    font:"",size:"0.78rem",weight:"800",spacing:"0.18em",transform:"uppercase",color:""},
    label_minor:{text:"",    position:"bottom", font:"",size:"0.62rem",weight:"600",spacing:"0.06em",transform:"none",     color:""},
    value:      {            font:"",size:"1.3rem", weight:"900",spacing:"0px",   transform:"none",     color:""},
    icon:       {name:"",   position:"none",   size:"1.4rem",color:""},
  };}

  setConfig(c){this._config=c;if(this._rendered){this._teardown();this._rendered=false;}}
  set hass(h){this._hass=h;if(!this._rendered){this._render();this._rendered=true;}this._syncEntity();this._watchHoliday();}
  getCardSize(){return 3;}

  _pad(n){return String(n).padStart(2,"0");}
  _yearMin(){return parseInt(this._config.year_min)||new Date().getFullYear()-2;}
  _yearMax(){return parseInt(this._config.year_max)||new Date().getFullYear()+10;}
  _yearRange(){return this._yearMax()-this._yearMin()+1;}

  _angleFrom(e,el){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const px=e.touches?e.touches[0].clientX:e.clientX,py=e.touches?e.touches[0].clientY:e.clientY;let a=Math.atan2(py-cy,px-cx)*180/Math.PI+90;return a<0?a+360:a;}
  _radiusRatio(e,el){const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;const px=e.touches?e.touches[0].clientX:e.clientX,py=e.touches?e.touches[0].clientY:e.clientY;return Math.sqrt((px-cx)**2+(py-cy)**2)/(r.width/2);}
  _teardown(){if(this._mv){window.removeEventListener("mousemove",this._mv);window.removeEventListener("touchmove",this._mv);}if(this._up){window.removeEventListener("mouseup",this._up);window.removeEventListener("touchend",this._up);}}

  _syncEntity(){
    if(!this._config.entity||!this._hass)return;
    const s=this._hass.states[this._config.entity];
    if(!s||s.state==="unavailable")return;
    const parts=s.state.split(" ")[0].split("-");
    if(parts.length<3)return;
    this._year=parseInt(parts[0],10);this._month=parseInt(parts[1],10);this._day=parseInt(parts[2],10);
    this._redraw();
  }

  /* ── holiday entity watcher ── */
  _watchHoliday(){
    if(!this._config.holiday_entity||!this._hass)return;
    const s=this._hass.states[this._config.holiday_entity];
    const wasHoliday=this._holiday;
    this._holiday=s?.state==="on";
    if(this._holiday!==wasHoliday) this._applyHoliday();
  }

  _applyHoliday(){
    const cap=this.shadowRoot.getElementById("cap");
    if(!cap)return;
    const color=this._config.holiday_color||"#e07070";
    if(this._holiday){
      // hex → rgba for tint
      const r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);
      cap.style.background=`rgba(${r},${g},${b},0.12)`;
      cap.style.boxShadow=`inset 5px 5px 12px var(--sh),inset -5px -5px 12px var(--light),0 0 0 2px rgba(${r},${g},${b},0.35)`;
      const dd=this.shadowRoot.getElementById("D-day");
      if(dd) dd.style.color=color;
    } else {
      cap.style.background="";
      cap.style.boxShadow="";
      const dd=this.shadowRoot.getElementById("D-day");
      if(dd) dd.style.color="";
    }
  }

  _saveEntity(){if(!this._config.entity||!this._hass)return;this._hass.callService("input_datetime","set_datetime",{entity_id:this._config.entity,date:`${this._year}-${this._pad(this._month)}-${this._pad(this._day)}`});}

  _iconEl(name,size,color){if(!name)return"";return`<ha-icon icon="${name}" style="--mdc-icon-size:${size};color:${color||"var(--muted)"};display:flex;align-items:center;"></ha-icon>`;}
  _labelHTML(cfgL,cls){const pos=cfgL?.position||"none";if(pos==="none"||!cfgL?.text)return{pos,html:""};return{pos,html:`<span class="${cls}" style="${_typoStyle(cfgL)}">${cfgL.text}</span>`};}

  _render(){
    const cfg=this._config,lma=cfg.label_major||{},lmi=cfg.label_minor||{},ico=cfg.icon||{};
    const slots={top:[],bottom:[],left:[],right:[]};
    const push=(pos,html)=>{if(pos&&pos!=="none"&&html&&slots[pos])slots[pos].push(html);};
    const ma=this._labelHTML(lma,"lbl-major");push(ma.pos,ma.html);
    const mi=this._labelHTML(lmi,"lbl-minor");push(mi.pos,mi.html);
    if(ico.name&&ico.position&&ico.position!=="none")push(ico.position,this._iconEl(ico.name,ico.size||"1.4rem",ico.color||""));
    const sh=a=>a.join("");
    const val=cfg.value||{};
    const valSty=_typoStyle(val,{size:"1.3rem",weight:"900"});
    const moSty =_typoStyle(val,{size:".64rem",weight:"700",spacing:".06em"});
    const yrSty =_typoStyle(val,{size:".58rem",weight:"600"});
    const hideBorder=cfg.hide_border===true||cfg.hide_border==="true";

    /*
     * Corona geometry (viewBox 260×260, cx=cy=130):
     *   day   corona: cap edge r=40  → r-day  inner edge r=58   span=18px
     *   month corona: r-day  outer r=58 → r-month inner edge r=91  span=33px
     *   year  corona: r-month outer r=91 → r-year  inner edge r=130 span=39px
     * Lines run the full width of each corona.
     */

    this.shadowRoot.innerHTML=`
    <style>
      :host{display:block;}
      .card{
        --bg:#e4e9f0;--light:#fff;--sh:#b8c0cc;--text:#2d3a52;--muted:#8fa0b8;
        --c-day:#9aafc8;--c-month:#a8b8a8;--c-year:#b0a8c0;
        background:${hideBorder?"transparent":"var(--bg)"};border-radius:28px;
        box-shadow:${hideBorder?"none":"10px 10px 26px var(--sh),-10px -10px 26px var(--light)"};
        padding:${hideBorder?"0":"26px 18px 30px"};
        display:grid;grid-template-areas:"top""mid""bot";grid-template-rows:auto 1fr auto;
        align-items:center;justify-items:center;gap:10px;font-family:'Nunito','Segoe UI',sans-serif;
      }
      .s-top{grid-area:top;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;min-height:4px;}
      .s-bot{grid-area:bot;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;min-height:4px;}
      .mid{grid-area:mid;display:flex;align-items:center;justify-content:center;gap:14px;}
      .s-left{display:flex;flex-direction:column;align-items:flex-end;gap:6px;min-width:4px;}
      .s-right{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:4px;}
      .lbl-major{font-size:.78rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);}
      .lbl-minor{font-size:.62rem;font-weight:600;letter-spacing:.08em;color:var(--muted);opacity:.8;}
      .stage{position:relative;width:260px;height:260px;touch-action:none;flex-shrink:0;}
      .ring{position:absolute;border-radius:50%;background:var(--bg);top:50%;left:50%;transform:translate(-50%,-50%) scale(0);opacity:0;pointer-events:none;transition:transform .65s cubic-bezier(.34,1.28,.64,1),opacity .5s ease;}
      .ring.on{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:all;cursor:grab;}
      .ring.on:active{cursor:grabbing;}
      .ring.dragging{outline:2px solid rgba(91,141,238,.18);outline-offset:-2px;}
      .r-year{width:260px;height:260px;box-shadow:9px 9px 22px var(--sh),-9px -9px 22px var(--light);transition-delay:0s;}
      .r-month{width:182px;height:182px;z-index:2;transition-delay:.09s;box-shadow:7px 7px 16px var(--sh),-7px -7px 16px var(--light),inset 2px 2px 5px var(--light),inset -2px -2px 5px var(--sh);}
      .r-day{width:116px;height:116px;z-index:4;transition-delay:.18s;box-shadow:5px 5px 12px var(--sh),-5px -5px 12px var(--light),inset 2px 2px 5px var(--light),inset -2px -2px 5px var(--sh);}
      .cap{
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:80px;height:80px;border-radius:50%;background:var(--bg);
        box-shadow:inset 5px 5px 12px var(--sh),inset -5px -5px 12px var(--light);
        z-index:10;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:1px;cursor:pointer;user-select:none;
        transition:background .35s ease,box-shadow .35s ease;
      }
      .cap:active{box-shadow:inset 3px 3px 7px var(--sh),inset -3px -3px 7px var(--light);}
      .cap-d,.cap-m,.cap-y{pointer-events:none;line-height:1;}
      .cap-d{color:var(--text);transition:color .35s ease;}
      .cap-m,.cap-y{color:var(--muted);}
      svg.ov{position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:9;opacity:0;transition:opacity .4s ease .25s;}
      svg.ov.on{opacity:1;}
      .l-day{stroke:var(--c-day);stroke-width:2.5;stroke-linecap:round;opacity:.85;}
      .l-month{stroke:var(--c-month);stroke-width:2.5;stroke-linecap:round;opacity:.85;}
      .l-year{stroke:var(--c-year);stroke-width:2.5;stroke-linecap:round;opacity:.85;}
      .t-day{stroke:var(--c-day);stroke-width:1;opacity:.3;}
      .t-month{stroke:var(--c-month);stroke-width:1;opacity:.3;}
      .t-year{stroke:var(--c-year);stroke-width:1;opacity:.25;}
    </style>
    <div class="card">
      <div class="s-top">${sh(slots.top)}</div>
      <div class="mid">
        <div class="s-left">${sh(slots.left)}</div>
        <div class="stage" id="stage">
          <div class="ring r-year"  id="R-year"></div>
          <div class="ring r-month" id="R-month"></div>
          <div class="ring r-day"   id="R-day"></div>
          <svg class="ov" id="SV" viewBox="0 0 260 260">
            <g id="G-year-ticks"></g><g id="G-month-ticks"></g><g id="G-day-ticks"></g>
            <line class="l-year"  id="L-year"  x1="130" y1="0"   x2="130" y2="39"/>
            <line class="l-month" id="L-month" x1="130" y1="39"  x2="130" y2="72"/>
            <line class="l-day"   id="L-day"   x1="130" y1="72"  x2="130" y2="90"/>
          </svg>
          <div class="cap" id="cap">
            <span class="cap-d" id="D-day"   style="${valSty}">01</span>
            <span class="cap-m" id="D-month" style="${moSty}">Jan</span>
            <span class="cap-y" id="D-year"  style="${yrSty}">2024</span>
          </div>
        </div>
        <div class="s-right">${sh(slots.right)}</div>
      </div>
      <div class="s-bot">${sh(slots.bottom)}</div>
    </div>`;

    this._drawTicks();this._redraw();this._bindEvents();
    // apply holiday state immediately after render
    this._watchHoliday();
  }

  _drawTicks(){
    const sh=this.shadowRoot,cx=130,cy=130;
    const mk=(g,rad,r1,r2,sw,cls)=>{const l=document.createElementNS("http://www.w3.org/2000/svg","line");l.setAttribute("x1",cx+r1*Math.cos(rad));l.setAttribute("y1",cy+r1*Math.sin(rad));l.setAttribute("x2",cx+r2*Math.cos(rad));l.setAttribute("y2",cy+r2*Math.sin(rad));l.setAttribute("stroke-width",sw);l.setAttribute("class",cls);g.appendChild(l);};
    const yr=this._yearRange(),yc=Math.min(yr,60);
    const gY=sh.getElementById("G-year-ticks");
    for(let i=0;i<yc;i++){const rad=(i/yc*360-90)*Math.PI/180,maj=yr<=20||i%Math.max(1,Math.floor(yc/12))===0;mk(gY,rad,maj?120:123,128,maj?2:1,"t-year");}
    const gM=sh.getElementById("G-month-ticks");
    for(let i=0;i<12;i++)mk(gM,(i/12*360-90)*Math.PI/180,82,90,2,"t-month");
    const gD=sh.getElementById("G-day-ticks");
    for(let i=0;i<31;i++){const rad=(i/31*360-90)*Math.PI/180,maj=i%5===0;mk(gD,rad,maj?49:51,57,maj?2:1,"t-day");}
  }

  _redraw(){
    const sh=this.shadowRoot,cx=130,cy=130;
    const dd=sh.getElementById("D-day");if(dd)dd.textContent=this._pad(this._day);
    const dm=sh.getElementById("D-month");if(dm)dm.textContent=MONTHS_SHORT[this._month-1];
    const dy=sh.getElementById("D-year");if(dy)dy.textContent=this._year;

    // year line: full corona r91 → r130
    const yFrac=(this._year-this._yearMin())/Math.max(1,this._yearRange()-1);
    const yRad=(yFrac*360-90)*Math.PI/180;
    const lY=sh.getElementById("L-year");
    if(lY){lY.setAttribute("x1",cx+91*Math.cos(yRad));lY.setAttribute("y1",cy+91*Math.sin(yRad));
            lY.setAttribute("x2",cx+130*Math.cos(yRad));lY.setAttribute("y2",cy+130*Math.sin(yRad));}

    // month line: full corona r58 → r91
    const mRad=((this._month-1)/12*360-90)*Math.PI/180;
    const lM=sh.getElementById("L-month");
    if(lM){lM.setAttribute("x1",cx+58*Math.cos(mRad));lM.setAttribute("y1",cy+58*Math.sin(mRad));
            lM.setAttribute("x2",cx+91*Math.cos(mRad));lM.setAttribute("y2",cy+91*Math.sin(mRad));}

    // day line: full corona r40 → r58
    const maxD=daysInMonth(this._month,this._year);
    const dRad=((this._day-1)/maxD*360-90)*Math.PI/180;
    const lD=sh.getElementById("L-day");
    if(lD){lD.setAttribute("x1",cx+40*Math.cos(dRad));lD.setAttribute("y1",cy+40*Math.sin(dRad));
            lD.setAttribute("x2",cx+58*Math.cos(dRad));lD.setAttribute("y2",cy+58*Math.sin(dRad));}
  }

  _expand(){const sh=this.shadowRoot;this._expanded=true;["R-year","R-month","R-day"].forEach(id=>sh.getElementById(id)?.classList.add("on"));sh.getElementById("SV")?.classList.add("on");}
  _collapse(){const sh=this.shadowRoot;this._expanded=false;this._active=null;["R-year","R-month","R-day"].forEach(id=>{const e=sh.getElementById(id);e?.classList.remove("on");e?.classList.remove("dragging");});sh.getElementById("SV")?.classList.remove("on");this._saveEntity();}
  _zone(r){if(r<0.22)return null;if(r<0.48)return"day";if(r<0.72)return"month";return"year";}

  _bindEvents(){
    const sh=this.shadowRoot,stage=sh.getElementById("stage"),cap=sh.getElementById("cap");
    cap.addEventListener("click",e=>{e.stopPropagation();this._expanded?this._collapse():this._expand();});
    const hl=zone=>{const map={day:"R-day",month:"R-month",year:"R-year"};["R-day","R-month","R-year"].forEach(id=>sh.getElementById(id)?.classList.remove("dragging"));if(zone&&map[zone])sh.getElementById(map[zone])?.classList.add("dragging");};
    const onStart=e=>{if(!this._expanded)return;const z=this._zone(this._radiusRatio(e,stage));if(!z)return;this._active=z;hl(z);e.preventDefault();};
    this._mv=e=>{
      if(!this._active)return;e.preventDefault();const a=this._angleFrom(e,stage);
      if(this._active==="year"){const range=this._yearRange(),idx=Math.round(a/360*range)%range;this._year=this._yearMin()+Math.max(0,Math.min(range-1,idx));this._day=clampDay(this._day,this._month,this._year);}
      else if(this._active==="month"){this._month=Math.max(1,Math.min(12,Math.round(a/360*12)||1));this._day=clampDay(this._day,this._month,this._year);}
      else{const maxD=daysInMonth(this._month,this._year);this._day=Math.max(1,Math.min(maxD,Math.round(a/360*maxD)||1));}
      this._redraw();
    };
    this._up=()=>{hl(null);this._active=null;};
    stage.addEventListener("mousedown",onStart);stage.addEventListener("touchstart",onStart,{passive:false});
    window.addEventListener("mousemove",this._mv);window.addEventListener("touchmove",this._mv,{passive:false});
    window.addEventListener("mouseup",this._up);window.addEventListener("touchend",this._up);
  }
}

customElements.define("datepicker-card",DatepickerCard);

/* ─────────────────────────────────────────────────────
   EDITOR
───────────────────────────────────────────────────── */
class DatepickerCardEditor extends NeuCardEditorBase {
  _render(){
    const y=new Date().getFullYear();
    this.shadowRoot.innerHTML=`
      ${this._editorCSS()}
      <div class="editor">
        ${this._section("Entity & Year Range",
          this._row("Entity",      this._entityPicker("input_datetime.my_date","input_datetime")),
          this._row("Year Min",    this._inp("year_min",y-2,"number")),
          this._row("Year Max",    this._inp("year_max",y+10,"number")),
          this._row("Hide Border", `<input type="checkbox" data-path="hide_border"${this._get("hide_border")==="true"||this._get("hide_border")===true?" checked":""}/>`),
        )}
        ${this._section("Holiday",
          this._row("Flag Entity", this._inp("holiday_entity","binary_sensor.is_holiday")),
          `<div class="hint">boolean entity — when on, cap is tinted</div>`,
          this._row("Highlight Color", this._colorRow("holiday_color")),
        )}
        ${this._labelSection("label_major","Major Label","e.g. Pick a date")}
        ${this._labelSection("label_minor","Minor Label","e.g. Tap to expand")}
        ${this._valueSection("value","Value Display")}
        ${this._iconSection("mdi:calendar · mdi:calendar-month · mdi:calendar-star")}
      </div>`;
    this._bindInputs();
  }
}

customElements.define("datepicker-card-editor",DatepickerCardEditor);

window.customCards=window.customCards||[];
window.customCards.push({type:"datepicker-card",name:"Neumorphic Date Picker",description:"Three-ring expanding neumorphic date picker with holiday highlight.",preview:true});
