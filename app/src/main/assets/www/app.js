const DAPI='https://api.dictionaryapi.dev/api/v2/entries/en/';
const TAPI='https://api.mymemory.translated.net/get';
let recent=JSON.parse(localStorage.getItem('yd_r')||'[]');
let favs=JSON.parse(localStorage.getItem('yd_f')||'[]');
let from={code:'en',name:'English',flag:'🇬🇧'};
let to={code:'ar',name:'Arabic',flag:'🇸🇦'};
let langTarget='from';
let lastWord='';
let isOnline=navigator.onLine;

window.addEventListener('online',()=>{isOnline=true;showBanner(false);});
window.addEventListener('offline',()=>{isOnline=false;showBanner(true);});

function showBanner(offline){
  let b=document.getElementById('netBanner');
  if(!b){b=document.createElement('div');b.id='netBanner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;padding:8px 16px;text-align:center;font-size:13px;font-weight:700;font-family:Inter,sans-serif;display:none';
    document.body.prepend(b);}
  if(offline){b.textContent='📵 Offline mode — using local dictionary';b.style.cssText+=';background:#f7c948;color:#0d1030;display:block';}
  else{b.style.background='#35d68c';b.style.color='#fff';b.textContent='✅ Back online';setTimeout(()=>b.style.display='none',2500);}
}

const LANGS=[
  {code:'en',name:'English',flag:'🇬🇧'},{code:'ar',name:'Arabic',flag:'🇸🇦'},
  {code:'fr',name:'French',flag:'🇫🇷'},{code:'es',name:'Spanish',flag:'🇪🇸'},
  {code:'de',name:'German',flag:'🇩🇪'},{code:'it',name:'Italian',flag:'🇮🇹'},
  {code:'pt',name:'Portuguese',flag:'🇧🇷'},{code:'ru',name:'Russian',flag:'🇷🇺'},
  {code:'zh',name:'Chinese',flag:'🇨🇳'},{code:'ja',name:'Japanese',flag:'🇯🇵'},
  {code:'ko',name:'Korean',flag:'🇰🇷'},{code:'tr',name:'Turkish',flag:'🇹🇷'},
  {code:'hi',name:'Hindi',flag:'🇮🇳'},{code:'nl',name:'Dutch',flag:'🇳🇱'},
  {code:'pl',name:'Polish',flag:'🇵🇱'},{code:'sv',name:'Swedish',flag:'🇸🇪'},
];

function initTheme(){
  const t=localStorage.getItem('yd_t')||'dark';
  document.body.className=t;
  const b=document.getElementById('themeBtn');
  if(b)b.textContent=t==='dark'?'☀️':'🌙';
}
function toggleTheme(){
  const t=document.body.className==='dark'?'light':'dark';
  document.body.className=t;localStorage.setItem('yd_t',t);
  const b=document.getElementById('themeBtn');
  if(b)b.textContent=t==='dark'?'☀️':'🌙';
}

function openLang(target){
  langTarget=target;
  const cur=target==='from'?from.code:to.code;
  _h('langItems',LANGS.map(l=>`
    <div class="lang-row-item ${l.code===cur?'sel':''}" onclick="pickLang('${l.code}','${l.name}','${l.flag}')">
      <span class="lri-flag">${l.flag}</span><span>${l.name}</span>
      ${l.code===cur?'<span class="lri-check">✓</span>':''}
    </div>`).join(''));
  document.getElementById('langModal').style.display='flex';
}
function closeLang(){document.getElementById('langModal').style.display='none';}
function pickLang(code,name,flag){
  if(langTarget==='from'){from={code,name,flag};_t('fFlag',flag);_t('fName',name);}
  else{to={code,name,flag};_t('tFlag',flag);_t('tName',name);}
  closeLang();
  if(lastWord)doTranslate(lastWord);
}
function swapLangs(){
  const tmp=from;from=to;to=tmp;
  _t('fFlag',from.flag);_t('fName',from.name);
  _t('tFlag',to.flag);_t('tName',to.name);
  if(lastWord)doTranslate(lastWord);
}
function _t(id,txt){const e=document.getElementById(id);if(e)e.textContent=txt;}
function _h(id,h){const e=document.getElementById(id);if(e)e.innerHTML=h;}

// ── AUDIO - Fixed for WebView ──────────────────────────────
function playAudio(url){
  if(!url)return;
  // Fix protocol for WebView
  if(url.startsWith('//'))url='https:'+url;
  try{
    const a=new Audio();
    a.src=url;
    a.oncanplay=()=>a.play().catch(()=>ttsSpeak(lastWord));
    a.onerror=()=>ttsSpeak(lastWord);
    a.load();
  }catch(e){ttsSpeak(lastWord);}
}
function ttsSpeak(text,lang){
  if(!text)return;
  if('speechSynthesis' in window){
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);
    u.lang=lang||'en-US';u.rate=0.9;
    window.speechSynthesis.speak(u);
  }
}

// ── OFFLINE ────────────────────────────────────────────────
function lookupOffline(w){
  if(typeof OFFLINE_DICT==='undefined')return null;
  return OFFLINE_DICT[w.toLowerCase()]||null;
}
function translateOffline(w,lang){
  if(typeof OFFLINE_TRANS==='undefined')return null;
  const d=OFFLINE_TRANS[w.toLowerCase()];
  return d&&d[lang]?d[lang]:null;
}

// ── SEARCH ─────────────────────────────────────────────────
async function search(word){
  const inp=document.getElementById('inp');
  if(word){if(inp)inp.value=word;}else{word=inp?.value.trim();}
  if(!word)return;
  word=word.toLowerCase().trim();
  lastWord=word;hideSugg();showResult();

  // Loading
  _h('wordHero',`<div style="padding:16px 16px 8px"><div style="font-size:30px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${word}</div></div>`);
  _h('pronRow','');
  _h('secDict','<div class="spin-center" style="padding:40px"><div class="spinner"></div></div>');
  _h('secTrans','<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>');
  _h('secSyn','<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>');

  if(isOnline){
    try{
      const r=await fetch(DAPI+encodeURIComponent(word));
      if(!r.ok)throw 0;
      const data=await r.json();
      buildHero(data,word);
      buildPron(data);
      buildDict(data);
      buildSyn(data);
      saveRecent(word);
    }catch{
      const off=lookupOffline(word);
      if(off){renderOffline(word,off);saveRecent(word);}
      else _h('secDict',errBox('🔍','Not found',`No results for "<strong>${word}</strong>"`,'goHome()'));
    }
  }else{
    const off=lookupOffline(word);
    if(off){renderOffline(word,off);saveRecent(word);}
    else _h('secDict',errBox('📵','Offline',`"<strong>${word}</strong>" not in offline dictionary<br><small style="color:var(--T3)">Offline: 195 words available</small>`,'goHome()'));
  }
  doTranslate(word);
}

function renderOffline(word,data){
  const isFav=favs.includes(word);
  _h('wordHero',`<div style="padding:16px 16px 8px">
    <div class="wh-top">
      <div style="font-size:30px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${word}</div>
      <div class="wh-acts">
        <button class="wh-act" onclick="ttsSpeak('${word}','en-US')">🔊</button>
        <button class="wh-act ${isFav?'fav-on':''}" id="favBtn" onclick="toggleFav('${word}',this)">${isFav?'❤️':'🤍'}</button>
      </div>
    </div>
    <span style="display:inline-block;background:rgba(247,199,72,.12);color:var(--Y);border:1px solid rgba(247,199,72,.25);border-radius:50px;padding:2px 10px;font-size:10px;font-weight:700;margin-top:6px">📵 Offline</span>
  </div>`);
  _h('pronRow',`<div class="pron-pill" onclick="ttsSpeak('${word}','en-GB')"><span class="pp-flag">🇬🇧</span><span class="pp-lbl">UK</span><span class="pp-play">▶ TTS</span></div>
    <div class="pron-pill" onclick="ttsSpeak('${word}','en-US')"><span class="pp-flag">🇺🇸</span><span class="pp-lbl">US</span><span class="pp-play">▶ TTS</span></div>`);
  _h('secDict',`<div class="m-card">
    <div class="m-pos-row"><div class="m-pos">${data.pos}</div><div class="m-pos-line"></div></div>
    <div class="def-item"><div class="def-top"><div class="def-num">1</div><div class="def-txt">${data.def}</div></div>${data.ex?`<div class="def-ex">${data.ex}</div>`:''}</div>
  </div>`);
  if(data.syn&&data.syn.length){
    _h('secSyn',`<div class="syn-card"><div class="syn-label">Synonyms</div><div class="syn-chips">${data.syn.map(s=>`<span class="syn-chip" onclick="search('${s}')">${s}</span>`).join('')}</div></div>
    ${data.ant&&data.ant.length?`<div class="syn-card"><div class="syn-label">Antonyms</div><div class="syn-chips">${data.ant.map(a=>`<span class="syn-chip ant-chip" onclick="search('${a}')">${a}</span>`).join('')}</div></div>`:''}`);
  }else{_h('secSyn','<div class="err-box" style="padding:20px"><p style="color:var(--T3)">Synonyms require internet.</p></div>');}
}

function buildHero(data,word){
  const e=data[0];const isFav=favs.includes(word);
  const phs=e.phonetics?.filter(p=>p.audio)||[];
  _h('wordHero',`<div style="padding:16px 16px 8px">
    <div class="wh-top">
      <div class="wh-word">${e.word}</div>
      <div class="wh-acts">
        <button class="wh-act" onclick="playAudio('${phs[0]?.audio||''}');ttsSpeak('${e.word}')">🔊</button>
        <button class="wh-act ${isFav?'fav-on':''}" id="favBtn" onclick="toggleFav('${word}',this)">${isFav?'❤️':'🤍'}</button>
      </div>
    </div>
  </div>`);
}

function buildPron(data){
  const e=data[0];
  const phs=e.phonetics?.filter(p=>p.text||p.audio)||[];
  const uk=phs.find(p=>p.audio?.includes('-uk'))||phs[0];
  const us=phs.find(p=>p.audio?.includes('-us'))||phs[1];
  let h='';
  if(uk)h+=`<div class="pron-pill" onclick="playAudio('${uk.audio||''}');if(!this.playing)ttsSpeak('${e.word}','en-GB')"><span class="pp-flag">🇬🇧</span><span class="pp-lbl">UK</span><span class="pp-ipa">${uk.text||''}</span><span class="pp-play">▶</span></div>`;
  if(us&&us!==uk)h+=`<div class="pron-pill" onclick="playAudio('${us.audio||''}');ttsSpeak('${e.word}','en-US')"><span class="pp-flag">🇺🇸</span><span class="pp-lbl">US</span><span class="pp-ipa">${us.text||''}</span><span class="pp-play">▶</span></div>`;
  if(!h)h=`<div class="pron-pill" onclick="ttsSpeak('${e.word}','en-GB')"><span class="pp-flag">🇬🇧</span><span class="pp-lbl">UK</span><span class="pp-play">▶ TTS</span></div>
    <div class="pron-pill" onclick="ttsSpeak('${e.word}','en-US')"><span class="pp-flag">🇺🇸</span><span class="pp-lbl">US</span><span class="pp-play">▶ TTS</span></div>`;
  _h('pronRow',h);
}

function buildDict(data){
  const e=data[0];let h='';
  e.meanings.forEach(m=>{
    h+=`<div class="m-card"><div class="m-pos-row"><div class="m-pos">${m.partOfSpeech}</div><div class="m-pos-line"></div></div>`;
    m.definitions.slice(0,5).forEach((d,i)=>{
      h+=`<div class="def-item"><div class="def-top"><div class="def-num">${i+1}</div><div class="def-txt">${d.definition}</div></div>${d.example?`<div class="def-ex">${d.example}</div>`:''}</div>`;
    });
    h+=`</div>`;
  });
  _h('secDict',h);
}

function buildSyn(data){
  const e=data[0];let syns=[],ants=[];
  e.meanings.forEach(m=>{
    syns=[...syns,...(m.synonyms||[])];ants=[...ants,...(m.antonyms||[])];
    m.definitions.forEach(d=>{syns=[...syns,...(d.synonyms||[])];ants=[...ants,...(d.antonyms||[])];});
  });
  syns=[...new Set(syns)].slice(0,16);ants=[...new Set(ants)].slice(0,16);
  let h='';
  if(syns.length)h+=`<div class="syn-card"><div class="syn-label">Synonyms</div><div class="syn-chips">${syns.map(s=>`<span class="syn-chip" onclick="search('${s}')">${s}</span>`).join('')}</div></div>`;
  if(ants.length)h+=`<div class="syn-card"><div class="syn-label">Antonyms</div><div class="syn-chips">${ants.map(a=>`<span class="syn-chip ant-chip" onclick="search('${a}')">${a}</span>`).join('')}</div></div>`;
  if(!syns.length&&!ants.length)h='<div class="err-box" style="padding:20px"><div style="font-size:28px;margin-bottom:8px">🔤</div><p style="color:var(--T3)">No synonyms found for this word.</p></div>';
  _h('secSyn',h);
}

function errBox(ico,title,msg,back){
  return `<div class="err-box"><div style="font-size:40px;margin-bottom:10px">${ico}</div><h3>${title}</h3><p>${msg}</p><button class="btn-grad" style="margin-top:16px" onclick="${back}">← Back</button></div>`;
}

async function doTranslate(word){
  const tp=document.getElementById('secTrans');if(!tp)return;
  // Try offline first
  const off=translateOffline(word,to.code);
  if(off){_h('secTrans',buildTC(off,true));return;}
  if(!isOnline){_h('secTrans',errBox('📵','Offline','Connect to internet to translate this word.','showSection("dict")'));return;}
  _h('secTrans','<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>');
  try{
    const r=await fetch(`${TAPI}?q=${encodeURIComponent(word)}&langpair=${from.code}|${to.code}`);
    const d=await r.json();
    _h('secTrans',buildTC(d.responseData.translatedText,false));
  }catch{_h('secTrans',errBox('🌐','Failed','Translation failed. Check internet.','showSection("dict")'));}
}

function buildTC(result,offline){
  return `<div class="trans-card">
    <div class="tc-lang">
      <span class="tc-flag">${to.flag}</span>
      <span class="tc-name">${to.name}</span>
      ${offline?'<span style="margin-left:auto;background:rgba(247,199,72,.12);color:var(--Y);border:1px solid rgba(247,199,72,.25);border-radius:50px;padding:2px 8px;font-size:10px;font-weight:700">📵 Offline</span>':''}
    </div>
    <div class="tc-text" id="tcTxt">${result}</div>
    <div class="tc-acts">
      <button class="tc-btn" onclick="navigator.clipboard?.writeText(document.getElementById('tcTxt').textContent)">📋 Copy</button>
      <button class="tc-btn" onclick="ttsSpeak(document.getElementById('tcTxt').textContent,'${to.code}')">🔊 Listen</button>
      <button class="tc-btn" onclick="openLang('to')">🌐 Change</button>
    </div>
  </div>`;
}

function showSection(s){
  ['dict','trans','syn'].forEach(x=>{
    const el=document.getElementById('sec'+x.charAt(0).toUpperCase()+x.slice(1));
    if(el)el.style.display=x===s?'block':'none';
  });
  document.querySelectorAll('.stab').forEach(t=>t.classList.toggle('active',t.dataset.s===s));
}

function showResult(){
  document.getElementById('resultArea').style.display='block';
  document.getElementById('homeArea').style.display='none';
  showSection('dict');
}
function goHome(){
  document.getElementById('resultArea').style.display='none';
  document.getElementById('homeArea').style.display='block';
  const inp=document.getElementById('inp');if(inp)inp.value='';
  updateClear();hideSugg();lastWord='';
}
function clearAll(){const inp=document.getElementById('inp');if(inp)inp.value='';updateClear();hideSugg();if(lastWord)goHome();}
function updateClear(){
  const inp=document.getElementById('inp'),x=document.getElementById('sbX');
  if(x)x.style.display=inp?.value.trim()?'flex':'none';
}

function toggleFav(word,btn){
  const i=favs.indexOf(word);
  if(i===-1){favs.push(word);btn.innerHTML='❤️';btn.classList.add('fav-on');}
  else{favs.splice(i,1);btn.innerHTML='🤍';btn.classList.remove('fav-on');}
  localStorage.setItem('yd_f',JSON.stringify(favs));
}

function saveRecent(w){
  recent=[w,...recent.filter(x=>x!==w)].slice(0,12);
  localStorage.setItem('yd_r',JSON.stringify(recent));renderRecent();
}
function clearRecent(){recent=[];localStorage.setItem('yd_r','[]');renderRecent();}
function renderRecent(){
  const b=document.getElementById('recentBlk'),c=document.getElementById('recentChips');
  if(!b||!c)return;
  if(!recent.length){b.style.display='none';return;}
  b.style.display='block';
  c.innerHTML=recent.map(w=>`<button class="chip" onclick="search('${w}')">${w}</button>`).join('');
}

function showSugg(val){
  const box=document.getElementById('suggDrop');if(!box)return;
  const offWords=typeof OFFLINE_DICT!=='undefined'?Object.keys(OFFLINE_DICT):[];
  const all=[...new Set([...recent,...offWords])];
  const m=all.filter(w=>w.startsWith(val)).slice(0,7);
  if(m.length){
    box.style.display='block';
    box.innerHTML=m.map(w=>`<div class="sd-item" onclick="search('${w}')"><span class="sd-ic">${recent.includes(w)?'🕐':'📖'}</span>${w}</div>`).join('');
  }else hideSugg();
}
function hideSugg(){const b=document.getElementById('suggDrop');if(b){b.style.display='none';b.innerHTML='';}}

const WODS=['ephemeral','serendipity','melancholy','resilience','eloquence','luminous','tenacious','labyrinth','solitude','whimsical'];
async function loadWOD(){
  const card=document.getElementById('wodCard');if(!card)return;
  const word=WODS[new Date().getDate()%WODS.length];
  if(isOnline){
    try{
      const r=await fetch(DAPI+word);const d=await r.json();
      const e=d[0];const def=e.meanings[0].definitions[0];
      card.innerHTML=`<div class="wod-badge">📅 Word of the Day</div>
        <div class="wod-word">${e.word}</div>
        ${e.phonetic?`<div class="wod-ph">${e.phonetic}</div>`:''}
        <div class="wod-pos">${e.meanings[0].partOfSpeech}</div>
        <div class="wod-def">${def.definition}</div>
        ${def.example?`<div class="wod-ex">${def.example}</div>`:''}
        <button class="wod-btn" onclick="search('${e.word}')">Explore word →</button>`;
      return;
    }catch{}
  }
  const off=lookupOffline(word);
  if(off){
    card.innerHTML=`<div class="wod-badge">📅 Word of the Day <small>(offline)</small></div>
      <div class="wod-word">${word}</div>
      <div class="wod-pos">${off.pos}</div>
      <div class="wod-def">${off.def}</div>
      ${off.ex?`<div class="wod-ex">${off.ex}</div>`:''}
      <button class="wod-btn" onclick="search('${word}')">Explore word →</button>`;
  }else{
    card.innerHTML='<div style="text-align:center;padding:16px;color:var(--T3)">Could not load</div>';
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  initTheme();renderRecent();loadWOD();
  if(!navigator.onLine)showBanner(true);
  const inp=document.getElementById('inp');
  if(inp){
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')search();});
    inp.addEventListener('input',()=>{
      updateClear();
      const v=inp.value.trim();
      if(v.length>=1)showSugg(v);else hideSugg();
    });
    document.addEventListener('click',e=>{if(!inp.contains(e.target))hideSugg();});
  }
  const p=new URLSearchParams(window.location.search);
  if(p.get('word'))search(p.get('word'));
});
