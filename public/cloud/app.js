// =========================
// Utilities
// =========================
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

const blessings = [
  "冬至福至，愿你所求皆如愿。",
  "饺子滚烫，日子也要滚烫。",
  "今夜最长，思念最暖。",
  "愿你冬有暖阳，心有归处。",
  "把烦恼包进皮里，煮成好消息。",
  "冬至团圆，愿你与所爱常相见。",
  "愿你一口饺子，一口好运。",
  "从此白昼渐长，幸福也渐长。",
  "热汤入喉，岁岁平安。",
  "这一冬，愿你被温柔以待。",
  "冬至到，愿你有灯可等，有人可归。",
  "把冷意留在门外，把热乎带进心里。",
  "愿你所遇皆善意，所行皆坦途。",
  "愿你冬日不惧风雪，心里常有春光。",
  "愿你这一年辛苦都被理解，温暖都被兑现。",
  "愿你把日子过成热汤，越喝越有劲儿。",
  "愿你与喜欢的人相逢，也与更好的自己重逢。",
  "愿你所念皆有回响，所盼皆有着落。",
  "愿你今晚不止有饺子，还有被惦记的幸福。",
  "冬至的风再冷，也吹不散你的好运。",
  "愿你熬过寒意，迎来更长的光。",
  "愿你不慌不忙，把每一天都过成礼物。",
  "愿你心里有火，眼里有光，脚下有路。",
  "愿你把烦恼交给时间，把温柔留给自己。",
  "愿你和想念的人，都在同一个月亮下团圆。",
  "愿你这一口咬下去，都是踏实与圆满。",
  "愿你被世界温柔相待，也敢温柔地热爱世界。",
  "愿你在冬夜里，也能遇见属于自己的晴天。",
  "愿你把小确幸攒成大幸福，把平凡过得闪闪发光。",
  "愿你所有努力，都在不久后开花结果。"
];

const fillingMeta = {
  pork: {name:"猪肉", persona:"踏实温暖型", sub:"你把爱放在细节里，稳稳当当地照顾着每一个人。"},
  beef: {name:"牛肉", persona:"爽朗直球型", sub:"你表达真诚又直接，热气腾腾的情绪从不拐弯。"},
  lamb: {name:"羊肉", persona:"外冷内热型", sub:"你看起来克制，心里却一直留着一团暖火。"},
  chive: {name:"韭菜", persona:"清爽鲜活型", sub:"你有小小的倔强和鲜明的喜欢，越相处越上头。"},
  onion: {name:"洋葱", persona:"嘴硬心软型", sub:"你不轻易说爱，但每次行动都很认真。"},
  shrimp: {name:"鲜虾", persona:"细腻浪漫型", sub:"你敏感又温柔，懂得把普通日子过成小小仪式。"},
  corn: {name:"玉米", persona:"甜系开朗型", sub:"你自带明亮滤镜，总能把氛围拉回温柔的方向。"},
  mushroom: {name:"香菇", persona:"清新治愈型", sub:"你像一杯热茶，清清爽爽却让人安心。"},
  egg: {name:"鸡蛋", persona:"稳稳可靠型", sub:"你擅长把复杂变简单，把日常过得松弛又踏实。"}
};

const fillingOrder = Object.keys(fillingMeta);

const fillingEmoji = {
  pork: "🐷",
  beef: "🐮",
  lamb: "🐑",
  chive: "🥬",
  onion: "🧅",
  shrimp: "🦐",
  corn: "🌽",
  mushroom: "🍄",
  egg: "🥚",
};

function emojiOfFilling(key){
  return fillingEmoji[key] || "🥟";
}

function selectedFillingKeys(){
  const raw = Array.isArray(state.fillings) && state.fillings.length
    ? state.fillings.slice()
    : (state.filling && fillingMeta[state.filling] ? [state.filling] : ["pork"]);
  const uniq = [];
  for(const k of raw){
    if(!fillingMeta[k]) continue;
    if(uniq.includes(k)) continue;
    uniq.push(k);
  }
  uniq.sort((a,b)=> fillingOrder.indexOf(a) - fillingOrder.indexOf(b));
  return uniq.length ? uniq : ["pork"];
}

function dumplingNameText(){
  const keys = selectedFillingKeys();
  const name = keys.map(k => (fillingMeta[k] || fillingMeta.pork).name).join("");
  return (name || "饺子") + "饺子";
}

function comboSeed(keys){
  let s = 7;
  for(const k of keys){
    const i = Math.max(0, fillingOrder.indexOf(k)) + 1;
    s = (s * 31 + i) % 1000000;
  }
  return s;
}

function comboRankFromIndices(idxs, n){
  const m = idxs.length;
  if(m === 1) return idxs[0];

  const c2 = (x)=> (x * (x - 1)) / 2;
  if(m === 2){
    const i = idxs[0], j = idxs[1];
    let r = 0;
    for(let a=0;a<i;a++) r += (n - 1 - a);
    r += (j - i - 1);
    return n + r;
  }

  if(m === 3){
    const i = idxs[0], j = idxs[1], k = idxs[2];
    let r = 0;
    for(let a=0;a<i;a++){
      r += c2(n - 1 - a);
    }
    for(let b=i+1;b<j;b++){
      r += (n - 1 - b);
    }
    r += (k - j - 1);
    return n + c2(n) + r;
  }

  return 0;
}

function personaForCombo(keys){
  keys = Array.isArray(keys) && keys.length ? keys.slice() : ["pork"];
  keys.sort((a,b)=> fillingOrder.indexOf(a) - fillingOrder.indexOf(b));
  const dn = keys.map(k => (fillingMeta[k] || fillingMeta.pork).name).join("") + "饺子";
  const seed = comboSeed(keys);

  const personaA = ["踏实","温暖","清爽","柔软","热烈","明亮","治愈","笃定","浪漫","松弛","元气","细腻","坦率","克制","清甜","俏皮","果敢"];
  const personaB = ["可靠","开朗","直球","有光","有劲","稳重","从容","上头","温柔","爽朗","治愈","不拐弯","不内耗","会照顾人","很认真","很会爱","很会玩"];
  const acts = ["把喜欢写在行动里","把生活过得有条不紊","把氛围点亮到刚刚好","把心意藏进细节里","把热气腾腾留给重要的人","把温柔留给自己也留给别人"];
  const ends = ["越相处越让人安心。","总能让人感觉被照顾。","看似随意，其实很认真。","外表淡淡，心里很热。","不爱多说，但句句算数。","能把普通日子过出仪式感。"];

  const traitBy = {
    pork: ["踏实","贴心"],
    beef: ["直球","爽朗"],
    lamb: ["克制","暖火"],
    chive: ["鲜活","倔强"],
    onion: ["嘴硬","心软"],
    shrimp: ["细腻","浪漫"],
    corn: ["甜系","开朗"],
    mushroom: ["清新","治愈"],
    egg: ["可靠","松弛"],
  };

  const traits = [];
  for(const k of keys){
    const ts = traitBy[k] || [];
    for(const t of ts){
      if(!traits.includes(t)) traits.push(t);
    }
  }

  const idxs = keys.map(k => fillingOrder.indexOf(k)).filter(i => i >= 0).sort((a,b)=>a-b);
  const r = comboRankFromIndices(idxs, fillingOrder.length);
  const a = personaA[r % personaA.length];
  let b = personaB[Math.floor(r / personaA.length) % personaB.length];
  if(b === a) b = personaB[(Math.floor(r / personaA.length) + 1) % personaB.length];
  const act = acts[(seed * 3) % acts.length];
  const end = ends[(seed * 7) % ends.length];
  const traitStr = traits.slice(0, 4).join("、");
  const persona = `${a}${b}型`;
  const sub = traitStr ? `你是${traitStr}的混合体，${act}，${end}` : `你${act}，${end}`;
  return { dumplingName: dn, persona, sub };
}

const state = {
  step: 1,
  flourIn: false,
  waterIn: false,
  kneadProgress: 0,
  rollScore: 0,
  filling: null,
  fillings: [],
  pinch: 0,
  sound: false,
  lastBless: null,
  participantCount: null,
  resultArtIndex: 0,
  shareImageUrl: null,
  done: {1:false,2:false,3:false,4:false},
  advancing: false
};

function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }

function haptic(ms=12){
  try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){}
}

let audioCtx = null;
function blip(freq=440, dur=0.06, type="sine", gain=0.035){
  if(!state.sound) return;
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }catch(e){}
}

function setSound(on){
  state.sound = !!on;
  const btn = $("#btnSound");
  btn.setAttribute("aria-pressed", String(state.sound));
  btn.textContent = state.sound ? "轻声·开" : "轻声";
  if(state.sound) blip(523.25, 0.08, "sine", 0.04);
}

function showToast(text){
  const toast = $("#toast");
  $("#toastText").textContent = text;
  toast.classList.remove("hidden");
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.classList.remove("show");
    toast.classList.add("hidden");
  }, 1900);
}

function pickBlessing(){
  let b = blessings[randInt(0, blessings.length-1)];
  if(b === state.lastBless){
    b = blessings[(blessings.indexOf(b)+1) % blessings.length];
  }
  state.lastBless = b;
  return b;
}

function setStep(step){
  step = clamp(step, 1, 5);
  state.step = step;
  const ids = ["#step1","#step2","#step3","#step4","#result"];
  ids.forEach((id, idx) => {
    const el = $(id);
    if(!el) return;
    if(idx === step-1 && step <= 4){
      el.classList.add("active");
      el.classList.add("fade-in");
    }else if(step===5 && id==="#result"){
      el.classList.add("active");
      el.classList.add("fade-in");
    }else{
      el.classList.remove("active");
    }
  });

  [1,2,3,4].forEach(n=>{
    const dot = $("#dot"+n);
    if(!dot) return;
    dot.classList.toggle("on", step===n);
  });

  const pct = step<=4 ? (step/4*100) : 100;
  $("#bar").style.width = pct + "%";

  const indicator = $("#stepIndicator");
  if(indicator){
    indicator.classList.toggle("hidden", step === 5);
  }

  try{ window.scrollTo({top:0, behavior:"smooth"}); }catch(e){ window.scrollTo(0,0); }
}

function completeStep(){
  const stepAtCall = state.step;
  if(stepAtCall >= 1 && stepAtCall <= 4 && state.done[stepAtCall]) return;
  if(state.advancing) return;
  if(stepAtCall >= 1 && stepAtCall <= 4) state.done[stepAtCall] = true;
  state.advancing = true;

  haptic(18);
  blip(659, 0.07, "triangle", 0.04);
  const b = pickBlessing();
  showToast(b);

  if(stepAtCall < 4){
    setTimeout(()=>{
      setStep(stepAtCall + 1);
      state.advancing = false;
    }, 450);
  }else{
    setTimeout(()=>{
      buildResult(b);
      setStep(5);
      registerParticipant();
      state.advancing = false;
    }, 520);
  }
}

function initDraggable(el, opts={}){
  const onDrop = opts.onDrop || (()=>false);
  let pId = null;
  let startX=0,startY=0;
  let baseX=0,baseY=0;

  const origin = {x:0,y:0};
  let hasOrigin = false;

  function ensureOrigin(){
    if(hasOrigin) return;
    const rect = el.getBoundingClientRect();
    origin.x = rect.left; origin.y = rect.top;
    hasOrigin = true;
  }

  function setTranslate(x,y){
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  function reset(){
    el.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1)";
    setTranslate(0,0);
    setTimeout(()=>{ el.style.transition = ""; }, 380);
  }

  function endDrag(){
    el.classList.remove("pop");
    el.classList.remove("dragging");
  }

  el.addEventListener("pointerdown", (e)=>{
    if(el.dataset.locked === "1") return;
    try{ e.preventDefault(); }catch(err){}

    ensureOrigin();
    pId = e.pointerId;
    try{ el.setPointerCapture(pId); }catch(err){}

    startX = e.clientX; startY = e.clientY;
    const tr = el.style.transform || "";
    const m = tr.match(/translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/);
    baseX = m ? parseFloat(m[1]) : 0;
    baseY = m ? parseFloat(m[2]) : 0;

    el.classList.add("dragging");
    el.classList.add("pop");
    blip(392, 0.04, "sine", 0.03);
  }, {passive:false});

  el.addEventListener("pointermove", (e)=>{
    if(pId !== e.pointerId) return;
    try{ e.preventDefault(); }catch(err){}
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    setTranslate(baseX + dx, baseY + dy);
  }, {passive:false});

  el.addEventListener("pointerup", (e)=>{
    if(pId !== e.pointerId) return;
    pId = null;
    const dropped = onDrop(el);
    endDrag();
    if(!dropped) reset();
  }, {passive:false});

  el.addEventListener("pointercancel", ()=>{
    pId=null;
    endDrag();
    reset();
  }, {passive:false});

  return {reset};
}

function inRect(px,py,rect){
  return px>=rect.left && px<=rect.right && py>=rect.top && py<=rect.bottom;
}

function initStep1(){
  const bowl = $("#bowl");
  const flour = $("#flour");
  const water = $("#water");
  const ingCount = $("#ingCount");
  const kneadBar = $("#kneadBar");
  const kneadText = $("#kneadText");
  const mixHint = $("#mixHint");
  const doughBall = $("#doughBall");

  function update(){
    const count = (state.flourIn?1:0) + (state.waterIn?1:0);
    ingCount.textContent = count;
    kneadBar.style.width = (count/2*55) + "%";
    if(count===0){
      kneadText.textContent = "等待食材";
      mixHint.classList.remove("hidden");
    }
    if(count===1){
      kneadText.textContent = "再加入一种";
      mixHint.classList.remove("hidden");
    }
    if(count===2){
      mixHint.classList.add("hidden");
      kneadText.textContent = "揉面中…";
      state.kneadProgress = 55;
      kneadBar.style.width = "70%";
      setTimeout(()=>{ kneadBar.style.width = "100%"; }, 350);
      setTimeout(()=>{
        kneadText.textContent = "和面完成";
        doughBall.classList.remove("hidden");
        doughBall.classList.add("pop");
        blip(523, 0.09, "sine", 0.05);
        completeStep();
      }, 950);
    }
  }

  function dropIntoBowl(whichEl){
    const r = whichEl.getBoundingClientRect();
    const br = bowl.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    if(!inRect(cx,cy,br)) return false;

    whichEl.dataset.locked = "1";
    whichEl.style.transition = "transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s ease";
    const targetX = (br.left + br.width/2) - (r.left + r.width/2);
    const targetY = (br.top + br.height/2) - (r.top + r.height/2);
    whichEl.style.transform = `translate(${targetX}px, ${targetY}px) scale(.7)`;
    whichEl.style.opacity = "0";

    if(whichEl.id === "flour") state.flourIn = true;
    if(whichEl.id === "water") state.waterIn = true;

    blip(330, 0.05, "triangle", 0.03);
    haptic(10);

    setTimeout(()=>{ whichEl.classList.add("hidden"); }, 360);
    update();
    return true;
  }

  initDraggable(flour, {onDrop: dropIntoBowl});
  initDraggable(water, {onDrop: dropIntoBowl});

  update();
}

function initStep2(){
  const rollArea = $("#rollArea");
  const wrapper = $("#wrapper");
  const rollBar = $("#rollBar");
  const rollPct = $("#rollPct");
  const rollText = $("#rollText");
  const rollWave = $("#rollWave");
  const btnSkip2 = $("#btnSkip2");

  let down = false;
  let lastX = 0;
  const target = 980;
  let finished = false;

  function render(){
    const p = clamp(state.rollScore/target, 0, 1);
    const pct = Math.round(p*100);
    rollPct.textContent = pct;
    rollBar.style.width = pct + "%";
    const scaleX = 1 + p * 1.25;
    const scaleY = 1 + p * 0.85;
    wrapper.style.transform = `scale(${scaleX}, ${scaleY})`;
    wrapper.style.filter = `brightness(${1 + p * 0.05})`;
    const outerA = Math.max(0.05, 0.14 - p * 0.06);
    const outerY = 24 - p * 6;
    const outerBlur = 70 - p * 18;
    wrapper.style.boxShadow = `inset 0 10px 22px rgba(255,255,255,.35), 0 ${outerY}px ${outerBlur}px rgba(59,47,42,${outerA})`;
    rollText.textContent = pct<5 ? "开始滑动" : (pct<70 ? "继续擀皮…" : (pct<95 ? "快好了…" : "圆圆满满"));
    if(p>=1 && !finished && state.step === 2){
      finished = true;
      rollText.textContent = "擀皮完成";
      rollWave.style.opacity = 0;
      down = false;
      setTimeout(()=> completeStep(), 220);
    }
  }

  function onDown(e){
    if(state.step !== 2) return;
    down = true;
    lastX = e.clientX;
    rollWave.style.opacity = 1;
    blip(294, 0.04, "sine", 0.02);
    try{ rollArea.setPointerCapture(e.pointerId); }catch(err){}
  }
  function onMove(e){
    if(!down || state.step !== 2) return;
    if(finished) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    state.rollScore += Math.min(26, Math.abs(dx))*1.25;
    if(state.rollScore % 120 < 12){ blip(220 + (state.rollScore/target)*180, 0.03, "triangle", 0.018); }
    render();
  }
  function onUp(){
    down = false;
    rollWave.style.opacity = 0;
  }

  rollArea.addEventListener("pointerdown", (e)=>{ try{ e.preventDefault(); }catch(err){}; onDown(e); }, {passive:false});
  rollArea.addEventListener("pointermove", (e)=>{ try{ e.preventDefault(); }catch(err){}; onMove(e); }, {passive:false});
  rollArea.addEventListener("pointerup", onUp, {passive:false});
  rollArea.addEventListener("pointercancel", onUp, {passive:false});

  btnSkip2.addEventListener("click", ()=>{
    if(state.step !== 2) return;
    const p = clamp(state.rollScore/target, 0, 1);
    if(p >= 0.9){
      state.rollScore = target;
      render();
      return;
    }
    showToast("再滑一会儿更圆哦～");
    haptic(8);
    blip(196, 0.06, "sine", 0.02);
  });

  render();
}

function initStep3(){
  const fbtns = $$(".fbtn");
  const fillingName = $("#fillingName");
  const pinchZone = $("#pinchZone");
  const pinchPct = $("#pinchPct");
  const pinchTip = $("#pinchTip");
  const fillingIcon = $("#fillingIcon");
  const skinL = $("#skinL");
  const skinR = $("#skinR");
  const gap = $("#gap");

  function renderWrap(){
    const p = clamp(state.pinch/6, 0, 1);
    if(skinL) skinL.style.transform = `translateX(${-Math.round((1-p)*100)}%)`;
    if(skinR) skinR.style.transform = `translateX(${Math.round((1-p)*100)}%)`;
    if(fillingIcon){
      const inner = fillingIcon.firstElementChild;
      if(inner){
        const s = 1 - p*0.16;
        const ty = p*10;
        inner.style.transform = `translateY(${ty}px) scale(${s})`;
        inner.style.filter = `blur(${p*0.6}px)`;
        inner.style.opacity = String(1 - p*0.15);
      }
    }
  }

  function renderSelected(){
    const keys = state.fillings || [];
    if(keys.length === 0){
      fillingName.textContent = "未选择";
      return;
    }
    fillingName.innerHTML = keys.map(k=>{
      const meta = fillingMeta[k] || fillingMeta.pork;
      const e = emojiOfFilling(k);
      return `<span class="inline-flex items-center gap-1 rounded-full border border-[#6b4e3d]/10 bg-white/70 px-2 py-1"><span aria-hidden="true">${e}</span><span>${meta.name}</span></span>`;
    }).join("");
  }

  function renderButtons(){
    const set = new Set(state.fillings || []);
    fbtns.forEach(b=>{
      const on = set.has(b.dataset.filling);
      b.classList.toggle("ring-2", on);
      b.classList.toggle("ring-orange-400/60", on);
      b.classList.toggle("bg-white", on);
    });
  }

  function renderFillingIcon(){
    if(!fillingIcon) return;
    const keys = state.fillings || [];
    if(keys.length === 0){
      fillingIcon.classList.add("hidden");
      fillingIcon.innerHTML = "";
      return;
    }
    const icons = keys.map(k=>`<span aria-hidden="true">${emojiOfFilling(k)}</span>`).join("");
    fillingIcon.innerHTML = `<div class="filling-stack">${icons}</div>`;
    fillingIcon.classList.remove("hidden");
  }

  function resetPinchUi(){
    state.pinch = 0;
    pinchPct.textContent = "0";
    gap.style.width = "112px";
    gap.style.opacity = "1";
    if(skinL) skinL.style.transform = "translateX(-100%)";
    if(skinR) skinR.style.transform = "translateX(100%)";
    pinchTip.textContent = (state.fillings && state.fillings.length) ? "点击饺子边缘开始捏合" : "先选最多 3 个馅儿";
    renderFillingIcon();
    renderWrap();
  }

  function toggleFilling(key){
    if(!fillingMeta[key]) return;
    state.fillings = Array.isArray(state.fillings) ? state.fillings : [];
    const idx = state.fillings.indexOf(key);
    if(idx >= 0){
      state.fillings.splice(idx, 1);
      state.filling = state.fillings.length ? state.fillings[state.fillings.length - 1] : null;
      resetPinchUi();
      renderButtons();
      renderSelected();
      blip(330, 0.05, "sine", 0.025);
      haptic(8);
      return;
    }

    if(state.fillings.length >= 3){
      showToast("最多选择 3 个馅料");
      blip(196, 0.06, "sine", 0.02);
      haptic(8);
      return;
    }

    state.fillings.push(key);
    state.filling = key;
    resetPinchUi();
    renderButtons();
    renderSelected();
    blip(523, 0.06, "sine", 0.04);
    haptic(12);
  }

  fbtns.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(state.step !== 3) return;
      toggleFilling(btn.dataset.filling);
    });
  });

  renderButtons();
  renderSelected();
  resetPinchUi();

  function pinchOnce(){
    if(state.step !== 3) return;
    if(!state.fillings || state.fillings.length === 0){
      showToast("先选一个馅儿～");
      blip(196, 0.06, "sine", 0.02);
      haptic(8);
      return;
    }
    if(state.pinch >= 6) return;
    state.pinch += 1;
    pinchPct.textContent = String(state.pinch);
    pinchZone.classList.remove("pop");
    void pinchZone.offsetWidth;
    pinchZone.classList.add("pop");
    const w = 112 - state.pinch*16;
    gap.style.width = Math.max(0, w) + "px";
    gap.style.opacity = state.pinch >= 5 ? "0" : "1";
    renderWrap();
    blip(440 + state.pinch*35, 0.05, "triangle", 0.03);
    haptic(10);

    pinchTip.textContent = state.pinch < 6 ? "再捏几下，把边缘封好" : "捏合完成";

    if(state.pinch >= 6){
      setTimeout(()=>{
        blip(659, 0.08, "sine", 0.05);
        completeStep();
      }, 240);
    }
  }

  pinchZone.addEventListener("click", pinchOnce);
  pinchZone.addEventListener("pointerdown", (e)=>{
    if(e.pointerType === "touch"){
      pinchOnce();
    }
  }, {passive:true});
}

function initStep4(){
  const dumpling = $("#dumplingToPot");
  const pot = $("#pot");
  const boil = $("#boil");

  function dropIntoPot(whichEl){
    const r = whichEl.getBoundingClientRect();
    const pr = pot.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    if(!inRect(cx, cy, pr)) return false;

    whichEl.dataset.locked = "1";
    whichEl.style.transition = "transform .38s cubic-bezier(.2,.8,.2,1), opacity .38s ease";
    const tx = (pr.left + pr.width/2) - cx;
    const ty = (pr.top + pr.height*0.42) - cy;
    whichEl.style.transform = `translate(${tx}px, ${ty}px) scale(.55)`;
    whichEl.style.opacity = "0";

    boil.style.opacity = 1;
    blip(220, 0.06, "sine", 0.03);
    blip(176, 0.08, "triangle", 0.02);
    haptic(18);

    setTimeout(()=>{
      boil.style.opacity = 0;
      whichEl.classList.add("hidden");
      completeStep();
    }, 520);
    return true;
  }

  initDraggable(dumpling, {onDrop: dropIntoPot});
}

function seededRng(seed){
  let t = (seed >>> 0) || 1;
  return function(){
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function dumplingSVGVariant(seed=1){
  const rnd = seededRng(seed);
  const ri = (a,b) => Math.floor(a + rnd() * (b - a + 1));
  const pick = (arr) => arr[ri(0, arr.length - 1)];

  const id = `d${seed}`;
  const gId = `g_${id}`;
  const fId = `s_${id}`;

  const bg = pick([
    { c1:"#fde68a", c2:"#fdba74", c3:"#93c5fd", op1:0.65, op2:0.55, op3:0.28 },
    { c1:"#fdba74", c2:"#fde68a", c3:"#a7f3d0", op1:0.55, op2:0.6, op3:0.22 },
    { c1:"#fecaca", c2:"#fde68a", c3:"#bfdbfe", op1:0.5, op2:0.55, op3:0.24 },
    { c1:"#fde68a", c2:"#fca5a5", c3:"#c7d2fe", op1:0.55, op2:0.45, op3:0.22 }
  ]);

  const accent = pick([
    { a:"#ea580c", b:"#6b4e3d", ao:0.38, bo:0.18 },
    { a:"#f97316", b:"#6b4e3d", ao:0.32, bo:0.16 },
    { a:"#d97706", b:"#6b4e3d", ao:0.36, bo:0.18 },
    { a:"#fb923c", b:"#6b4e3d", ao:0.28, bo:0.16 }
  ]);

  const baseFill = pick([
    { gType:"linear", cx:"", cy:"", r:"", x1:"0", y1:"0", x2:"0", y2:"1" },
    { gType:"radial", cx:"35%", cy:"25%", r:"72%", x1:"", y1:"", x2:"", y2:"" },
    { gType:"radial", cx:"42%", cy:"28%", r:"76%", x1:"", y1:"", x2:"", y2:"" }
  ]);

  const dumplingPath = pick([
    "M80 150c0-48 64-86 140-86s140 38 140 86c0 42-48 76-140 76s-140-34-140-76Z",
    "M70 160c16-56 76-96 150-96s134 40 150 96c10 34-30 64-150 64s-160-30-150-64Z",
    "M85 150c0-50 58-90 135-90s135 40 135 90c0 44-45 80-135 80s-135-36-135-80Z",
    "M70 152c0-50 70-92 150-92s150 42 150 92c0 46-54 84-150 84S70 198 70 152Z"
  ]);

  const pleatStyle = ri(0, 3);
  let pleats = "";
  if(pleatStyle === 0){
    const x1 = ri(108, 130);
    const x2 = ri(292, 318);
    const y = ri(136, 152);
    pleats = `<path d="M${x1} ${y}c26-18 60-28 100-28s74 10 100 28" fill="none" stroke="${accent.a}" stroke-opacity="${accent.ao}" stroke-width="6" stroke-linecap="round"/>`;
  }else if(pleatStyle === 1){
    const y = ri(148, 160);
    const segs = [120, 165, 210, 255, 300].map(x => {
      const h = ri(14, 22);
      const w = ri(24, 34);
      const x2 = x + w;
      const y2 = y + h;
      return `<path d="M${x} ${y}c8 12 18 18 30 18" transform="translate(${ri(-6,6)} ${ri(-4,4)})" fill="none" stroke="${accent.a}" stroke-opacity="${accent.ao + 0.08}" stroke-width="6" stroke-linecap="round"/>`;
    });
    pleats = segs.join("");
  }else if(pleatStyle === 2){
    const y = ri(124, 138);
    const n = ri(5, 7);
    const start = ri(120, 150);
    const gap = ri(26, 34);
    const dots = Array.from({length:n}).map((_,i)=>{
      const x = start + i * gap + ri(-4,4);
      const r = ri(4, 6);
      return `<circle cx="${x}" cy="${y + ri(-3,3)}" r="${r}" fill="${accent.a}" fill-opacity="${accent.ao}" />`;
    });
    pleats = dots.join("");
  }else{
    const y1 = ri(122, 134);
    const y2 = y1 + ri(34, 46);
    const w = ri(4, 6);
    pleats =
      `<path d="M130 ${y1}c30-20 64-30 90-30s60 10 90 30" fill="none" stroke="${accent.b}" stroke-opacity="${accent.bo}" stroke-width="${w}" stroke-linecap="round"/>` +
      `<path d="M140 ${y2}c20 10 46 16 80 16s60-6 80-16" fill="none" stroke="${accent.a}" stroke-opacity="${accent.ao}" stroke-width="${w+1}" stroke-linecap="round"/>`;
  }

  const circles = [
    { x: ri(46, 98), y: ri(44, 78), r: ri(8, 14), c: bg.c1, o: bg.op1 },
    { x: ri(312, 374), y: ri(44, 76), r: ri(10, 16), c: bg.c2, o: bg.op2 },
    { x: ri(252, 396), y: ri(168, 224), r: ri(10, 22), c: bg.c3, o: bg.op3 }
  ];

  const hiA = { x1: ri(90, 120), y1: ri(84, 104), x2: ri(132, 170), y2: ri(88, 112), o: 0.55 + rnd()*0.2 };
  const hiB = { x1: ri(286, 306), y1: ri(198, 216), x2: ri(360, 396), y2: ri(206, 232), o: 0.28 + rnd()*0.22 };

  const gradientDef =
    baseFill.gType === "linear"
      ? `<linearGradient id="${gId}" x1="${baseFill.x1}" x2="${baseFill.x2}" y1="${baseFill.y1}" y2="${baseFill.y2}">
  <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
  <stop offset=".6" stop-color="#fff" stop-opacity=".62"/>
  <stop offset="1" stop-color="#f5dcc3" stop-opacity=".88"/>
</linearGradient>`
      : `<radialGradient id="${gId}" cx="${baseFill.cx}" cy="${baseFill.cy}" r="${baseFill.r}">
  <stop offset="0" stop-color="#fff" stop-opacity=".95"/>
  <stop offset=".55" stop-color="#fff" stop-opacity=".62"/>
  <stop offset="1" stop-color="#f5dcc3" stop-opacity=".88"/>
</radialGradient>`;

  return `<svg viewBox="0 0 420 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="饺子插画">
  <defs>
    ${gradientDef}
    <filter id="${fId}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#3b2f2a" flood-opacity=".16"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="420" height="260" rx="24" fill="#fff" fill-opacity=".55"/>
  ${circles.map(c=>`<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="${c.c}" fill-opacity="${c.o}"/>`).join("")}
  <g filter="url(#${fId})">
    <path d="${dumplingPath}" fill="url(#${gId})" stroke="#6b4e3d" stroke-opacity=".16" stroke-width="2"/>
    ${pleats}
  </g>
  <path d="M${hiA.x1} ${hiA.y1}c22 8 40 8 54 0" fill="none" stroke="#fff" stroke-opacity="${hiA.o}" stroke-width="7" stroke-linecap="round"/>
  <path d="M${hiB.x1} ${hiB.y1}c26 2 54-2 78-12" fill="none" stroke="#fff" stroke-opacity="${hiB.o}" stroke-width="7" stroke-linecap="round"/>
</svg>`;
}

function buildResult(lastBlessing){
  const keys = selectedFillingKeys();
  const primaryKey = state.filling || keys[0] || "pork";
  const meta = fillingMeta[primaryKey] || fillingMeta.pork;
  const combo = personaForCombo(keys);
  let artSeed = randInt(1, 999999);
  if(artSeed === state.resultArtIndex) artSeed += 1;
  state.resultArtIndex = artSeed;

  $("#dumplingArt").innerHTML = dumplingSVGVariant(artSeed);
  const tag = $("#resultDumplingName");
  if(tag) tag.textContent = combo.dumplingName;
  $("#persona").textContent = combo.persona;
  $("#personaSub").textContent = combo.sub;
  $("#finalBless").textContent = lastBlessing || pickBlessing();

  $("#participants").textContent = state.participantCount ?? "…";
}

async function fetchJSON(url, options){
  const res = await fetch(url, options);
  if(!res.ok) throw new Error("HTTP " + res.status);
  return await res.json();
}

function localCount(increment=false){
  const k = "yun-jiaozi-participants";
  const cur = parseInt(localStorage.getItem(k) || "0", 10) || 0;
  const next = increment ? (cur + 1) : cur;
  localStorage.setItem(k, String(next));
  return next;
}

async function registerParticipant(){
  try{
    const data = await fetchJSON("/api/participants", {method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({event:"yun_jiaozi_dongzhi"})});
    if(typeof data.count === "number"){
      state.participantCount = data.count;
      $("#participants").textContent = data.count;
      return;
    }
    throw new Error("bad payload");
  }catch(e){
    const n = localCount(true);
    state.participantCount = n;
    $("#participants").textContent = n;
  }
}

async function refreshParticipant(){
  try{
    const data = await fetchJSON("/api/participants", {method:"GET"});
    if(typeof data.count === "number"){
      state.participantCount = data.count;
      $("#participants").textContent = data.count;
      showToast("参与人数已更新");
      return;
    }
    throw new Error("bad payload");
  }catch(e){
    const n = localCount(false);
    state.participantCount = n;
    $("#participants").textContent = n;
    showToast("当前为本地演示计数");
  }
}

function shareText(){
  const keys = selectedFillingKeys();
  const primaryKey = state.filling || keys[0] || "pork";
  const meta = fillingMeta[primaryKey] || fillingMeta.pork;
  const combo = personaForCombo(keys);
  const fillingName = keys.map(k => (fillingMeta[k] || fillingMeta.pork).name).join("");
  const bless = $("#finalBless").textContent || pickBlessing();
  const count = $("#participants").textContent || "—";
  return `我在《云包饺子·冬至团圆局》包了一只“${fillingName}”饺子，获得【${combo.persona}】标签。\n${bless}\n当前参与人数：${count}人\n（打开链接一起包饺子）`;
}

async function doShare(){
  const text = shareText();
  const url = location.href;
  try{
    await navigator.clipboard.writeText(text + "\n" + url);
    showToast("已复制分享文案");
    blip(523, 0.06, "sine", 0.04);
  }catch(e){
    prompt("复制以下文案分享给朋友：", text + "\n" + url);
  }
}

function openShareSheet(){
  if(state.step !== 5) return;
  $("#shareSheet").classList.remove("hidden");
}

function closeShareSheet(){
  $("#shareSheet").classList.add("hidden");
}

function openShareImageModal(){
  if(state.step !== 5) return;
  $("#shareImageModal").classList.remove("hidden");
}

function closeShareImageModal(){
  $("#shareImageModal").classList.add("hidden");
  const preview = $("#shareImagePreview");
  preview.removeAttribute("src");
  if(state.shareImageUrl){
    try{ URL.revokeObjectURL(state.shareImageUrl); }catch(e){}
    state.shareImageUrl = null;
  }
}

function shuffleResultArt(){
  if(state.step !== 5) return;
  let artSeed = randInt(1, 999999);
  if(artSeed === state.resultArtIndex) artSeed += 1;
  state.resultArtIndex = artSeed;
  $("#dumplingArt").innerHTML = dumplingSVGVariant(artSeed);
  blip(523, 0.05, "sine", 0.03);
  haptic(10);
}

function roundRectPath(ctx, x, y, w, h, r){
  const rr = Math.min(r, w/2, h/2);
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth){
  const s = String(text || "");
  if(!s) return [""];
  if(ctx.measureText(s).width <= maxWidth) return [s];
  const parts = s.split(/\s+/).filter(Boolean);
  const useWords = parts.length > 1;
  const units = useWords ? parts : Array.from(s);
  const joiner = useWords ? " " : "";
  const lines = [];
  let cur = "";
  for(const u of units){
    const next = cur ? (cur + joiner + u) : u;
    if(ctx.measureText(next).width <= maxWidth){
      cur = next;
      continue;
    }
    if(cur) lines.push(cur);
    cur = u;
  }
  if(cur) lines.push(cur);
  return lines.length ? lines : [s];
}

function svgStringToImage(svg){
  return new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=> resolve(img);
    img.onerror = reject;
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

async function uploadShareImage(blob){
  const res = await fetch("/api/share-image", { method: "POST", headers: { "Content-Type": blob.type || "application/octet-stream" }, body: blob });
  if(!res.ok) throw new Error("share_image_http_" + res.status);
  return await res.json();
}

async function fetchQrImage(url){
  const res = await fetch("/api/share-qr?data=" + encodeURIComponent(url));
  if(!res.ok) throw new Error("qr_http_" + res.status);
  const blob = await res.blob();
  const obj = URL.createObjectURL(blob);
  try{
    const img = await new Promise((resolve, reject)=>{
      const i = new Image();
      i.onload = ()=> resolve(i);
      i.onerror = reject;
      i.src = obj;
    });
    return img;
  }finally{
    URL.revokeObjectURL(obj);
  }
}

async function generateShareImagePreview(){
  if(state.step !== 5) return;

  const shareUrl = location.href;
  const keys = selectedFillingKeys();
  const primaryKey = state.filling || keys[0] || "pork";
  const meta = fillingMeta[primaryKey] || fillingMeta.pork;
  const combo = personaForCombo(keys);
  const bless = $("#finalBless").textContent || pickBlessing();
  const count = $("#participants").textContent || "—";
  const artSeed = state.resultArtIndex || 1;
  const svg = dumplingSVGVariant(artSeed);

  showToast("正在生成分享图片…");

  const [artImg, qrImg] = await Promise.all([
    svgStringToImage(svg),
    fetchQrImage(shareUrl)
  ]);

  const W = 1080;
  const H = 1520;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#fff7ed");
  bg.addColorStop(1, "#ffe9d4");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cardX = 72, cardY = 90, cardW = W - 144, cardH = H - 180;
  roundRectPath(ctx, cardX, cardY, cardW, cardH, 48);
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.fill();
  ctx.strokeStyle = "rgba(107,78,61,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const titleX = cardX + 56;
  let y = cardY + 92;
  ctx.fillStyle = "#3b2f2a";
  ctx.font = "700 50px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText("云包饺子·冬至团圆局", titleX, y);
  y += 50;
  ctx.fillStyle = "rgba(107,78,61,0.92)";
  ctx.font = "500 32px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText("你的专属饺子结果", titleX, y);
  y += 60;
  ctx.fillStyle = "#ea580c";
  ctx.font = "800 44px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText(combo.dumplingName, titleX, y);

  const artBoxX = cardX + 56;
  const artBoxY = y + 46;
  const artBoxW = cardW - 112;
  const artBoxH = 440;
  roundRectPath(ctx, artBoxX, artBoxY, artBoxW, artBoxH, 44);
  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.fill();
  ctx.strokeStyle = "rgba(107,78,61,0.12)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const pad = 34;
  const drawW = artBoxW - pad*2;
  const drawH = artBoxH - pad*2;
  const sx = drawW / artImg.width;
  const sy = drawH / artImg.height;
  const s = Math.min(sx, sy);
  const dw = Math.floor(artImg.width * s);
  const dh = Math.floor(artImg.height * s);
  const dx = artBoxX + Math.floor((artBoxW - dw)/2);
  const dy = artBoxY + Math.floor((artBoxH - dh)/2);
  ctx.drawImage(artImg, dx, dy, dw, dh);

  const qrSize = 240;
  const qrBoxX = cardX + cardW - 56 - qrSize;
  const qrBoxY = cardY + cardH - 56 - qrSize;
  const qrTopY = qrBoxY - 70;
  const maxTextW = (cardX + cardW - 56) - titleX;
  let infoY = artBoxY + artBoxH + 78;
  ctx.fillStyle = "rgba(107,78,61,0.8)";
  ctx.font = "500 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText("饺子馅人格标签", titleX, infoY);
  infoY += 50;
  ctx.fillStyle = "#3b2f2a";
  ctx.font = "800 44px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText(combo.persona, titleX, infoY);
  infoY += 54;
  ctx.fillStyle = "rgba(107,78,61,0.92)";
  ctx.font = "500 32px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  const subLines = wrapLines(ctx, combo.sub, maxTextW);
  const subLineH = 46;
  const bottomLimitY = cardY + cardH - 56;
  const minAfterSubY = 84 + 52 + 26;
  const subMaxByQr = Math.max(0, Math.min(5, Math.floor((qrTopY - 16 - infoY) / subLineH) + 1));
  const subMaxByBottom = Math.max(0, Math.min(5, Math.floor((bottomLimitY - minAfterSubY - infoY) / subLineH) + 1));
  const subMax = Math.min(subMaxByQr, subMaxByBottom);
  for(let i=0;i<Math.min(subLines.length, subMax);i++){
    ctx.fillText(subLines[i], titleX, infoY);
    infoY += 46;
  }

  infoY += 34;
  ctx.fillStyle = "rgba(107,78,61,0.8)";
  ctx.font = "500 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText("冬至祝福", titleX, infoY);
  infoY += 50;
  ctx.fillStyle = "#3b2f2a";
  ctx.font = "650 36px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  const blessTextW = Math.max(260, (qrBoxX - 28) - titleX);
  const lines = wrapLines(ctx, bless, blessTextW);
  const blessLineH = 52;
  const blessMax = Math.max(0, Math.min(5, Math.floor((bottomLimitY - 26 - infoY) / blessLineH) + 1));
  for(let i=0;i<Math.min(lines.length, blessMax);i++){
    ctx.fillText(lines[i], titleX, infoY);
    infoY += 52;
  }

  infoY += 26;
  ctx.fillStyle = "rgba(107,78,61,0.8)";
  ctx.font = "500 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  const label1 = "当前";
  ctx.fillText(label1, titleX, infoY);
  const w1 = ctx.measureText(label1).width;
  
  ctx.fillStyle = "#3b2f2a";
  ctx.font = "900 44px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  const countStr = String(count);
  ctx.fillText(countStr, titleX + w1 + 12, infoY);
  const w2 = ctx.measureText(countStr).width;

  ctx.fillStyle = "rgba(107,78,61,0.92)";
  ctx.font = "600 30px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.fillText("人正在云包饺子", titleX + w1 + 12 + w2 + 12, infoY);

  roundRectPath(ctx, qrBoxX - 22, qrBoxY - 70, qrSize + 44, qrSize + 92, 34);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fill();
  ctx.strokeStyle = "rgba(107,78,61,0.14)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrSize, qrSize);
  
  ctx.fillStyle = "rgba(107,78,61,0.9)";
  ctx.font = "700 28px system-ui,-apple-system,Segoe UI,Roboto,PingFang SC,Microsoft YaHei,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("扫码一起包饺子", qrBoxX + qrSize/2, qrBoxY - 26);
  ctx.textAlign = "start";

  if(state.shareImageUrl){
    try{ URL.revokeObjectURL(state.shareImageUrl); }catch(e){}
    state.shareImageUrl = null;
  }

  const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.92)) || await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
  if(blob){
    try{
      const data = await uploadShareImage(blob);
      if(data && data.url){
        $("#shareImagePreview").setAttribute("src", data.url);
        openShareImageModal();
        showToast("图片已生成，长按保存");
        return;
      }
      throw new Error("bad_share_image_payload");
    }catch(e){}
    const obj = URL.createObjectURL(blob);
    state.shareImageUrl = obj;
    $("#shareImagePreview").setAttribute("src", obj);
  }else{
    const dataUrl = canvas.toDataURL("image/png");
    $("#shareImagePreview").setAttribute("src", dataUrl);
  }
  openShareImageModal();
  showToast("图片已生成，长按保存");
}

function resetGame(){
  location.reload();
}

function initFX(){
  const c = $("#fx");
  const ctx = c.getContext("2d");
  let W=0,H=0,dpr=1;
  const flakes = [];
  const N = 46;

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = Math.floor(W*dpr);
    c.height = Math.floor(H*dpr);
    c.style.width = W + "px";
    c.style.height = H + "px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function spawn(){
    flakes.length = 0;
    for(let i=0;i<N;i++){
      flakes.push({
        x: Math.random()*W,
        y: Math.random()*H,
        r: 1 + Math.random()*2.2,
        s: 0.2 + Math.random()*0.8,
        a: 0.08 + Math.random()*0.18,
        w: (Math.random()*0.8 - 0.4)
      });
    }
  }

  function tick(){
    ctx.clearRect(0,0,W,H);
    for(const f of flakes){
      f.y += f.s;
      f.x += f.w;
      if(f.y > H + 10){ f.y = -10; f.x = Math.random()*W; }
      if(f.x < -10) f.x = W + 10;
      if(f.x > W + 10) f.x = -10;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${f.a})`;
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }

  resize();
  spawn();
  tick();
  window.addEventListener("resize", ()=>{ resize(); spawn(); }, {passive:true});
}

function init(){
  initFX();

  $("#btnHelp").addEventListener("click", ()=>{
    $("#help").classList.remove("hidden");
    blip(440, 0.05, "sine", 0.03);
  });
  $("#btnCloseHelp").addEventListener("click", ()=> $("#help").classList.add("hidden"));
  $("#help").addEventListener("click", (e)=>{ if(e.target.id==="help") $("#help").classList.add("hidden"); });

  $("#btnSound").addEventListener("click", ()=> setSound(!state.sound));

  $("#btnStart").addEventListener("click", ()=>{
    $("#start").classList.add("hidden");
    setSound(false);
    showToast(pickBlessing());
  });

  $("#btnReplay").addEventListener("click", resetGame);
  $("#btnShuffleArt").addEventListener("click", shuffleResultArt);
  $("#btnShare").addEventListener("click", openShareSheet);
  $("#btnCloseShareSheet").addEventListener("click", closeShareSheet);
  $("#shareSheetMask").addEventListener("click", closeShareSheet);
  $("#btnShareLink").addEventListener("click", async ()=>{
    closeShareSheet();
    await doShare();
  });
  $("#btnShareImage").addEventListener("click", async ()=>{
    closeShareSheet();
    try{
      await generateShareImagePreview();
    }catch(e){
      showToast("生成失败，请稍后重试");
    }
  });
  $("#btnCloseShareImage").addEventListener("click", closeShareImageModal);
  $("#shareImageMask").addEventListener("click", closeShareImageModal);
  $("#btnRefreshCount").addEventListener("click", refreshParticipant);

  initStep1();
  initStep2();
  initStep3();
  initStep4();

  const observer = new MutationObserver(()=>{});
  observer.observe($("#step1"), {attributes:true, attributeFilter:["class"]});

  setStep(1);
}

init();
