const DAPI='https://api.dictionaryapi.dev/api/v2/entries/en/';
const TAPI='https://api.mymemory.translated.net/get';
let recent=JSON.parse(localStorage.getItem('yd_r')||'[]');
let favs=JSON.parse(localStorage.getItem('yd_f')||'[]');
let from={code:'en',name:'English',flag:'🇬🇧'};
let to={code:'ar',name:'Arabic',flag:'🇸🇦'};
let langTarget='from';
let lastWord='';
let isOnline=navigator.onLine;

window.addEventListener('online',()=>{isOnline=true;showNetBanner(false);});
window.addEventListener('offline',()=>{isOnline=false;showNetBanner(true);});

function showNetBanner(offline){
  let b=document.getElementById('netBanner');
  if(!b){
    b=document.createElement('div');b.id='netBanner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;padding:8px 16px;text-align:center;font-size:13px;font-weight:700;transition:all .3s';
    document.body.prepend(b);
  }
  if(offline){b.textContent='📵 Offline mode — using local dictionary';b.style.background='#f7c948';b.style.color='#0d1030';b.style.display='block';}
  else{b.textContent='✅ Back online';b.style.background='#35d68c';b.style.color='#fff';setTimeout(()=>b.style.display='none',2000);}
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
  document.getElementById('langItems').innerHTML=LANGS.map(l=>`
    <div class="lang-row-item ${l.code===cur?'sel':''}" onclick="pickLang('${l.code}','${l.name}','${l.flag}')">
      <span class="lri-flag">${l.flag}</span><span>${l.name}</span>
      ${l.code===cur?'<span class="lri-check">✓</span>':''}
    </div>`).join('');
  document.getElementById('langModal').style.display='flex';
}
function closeLang(){document.getElementById('langModal').style.display='none';}
function pickLang(code,name,flag){
  if(langTarget==='from'){from={code,name,flag};_s('fFlag',flag);_s('fName',name);}
  else{to={code,name,flag};_s('tFlag',flag);_s('tName',name);}
  closeLang();
  if(lastWord)doTranslate(lastWord);
}
function swapLangs(){
  const tmp=from;from=to;to=tmp;
  _s('fFlag',from.flag);_s('fName',from.name);
  _s('tFlag',to.flag);_s('tName',to.name);
  if(lastWord)doTranslate(lastWord);
}
function _s(id,txt){const e=document.getElementById(id);if(e)e.textContent=txt;}
function _h(id,h){const e=document.getElementById(id);if(e)e.innerHTML=h;}

// ── OFFLINE LOOKUP ─────────────────────────────────────────
function lookupOffline(word){
  if(typeof OFFLINE_DICT==='undefined')return null;
  return OFFLINE_DICT[word.toLowerCase()]||null;
}
function translateOffline(word,toLang){
  if(typeof OFFLINE_TRANS==='undefined')return null;
  const w=word.toLowerCase();
  if(OFFLINE_TRANS[w]&&OFFLINE_TRANS[w][toLang])return OFFLINE_TRANS[w][toLang];
  return null;
}

// ── SEARCH ─────────────────────────────────────────────────
async function search(word){
  const inp=document.getElementById('inp');
  if(word){if(inp)inp.value=word;}else{word=inp?.value.trim();}
  if(!word)return;
  word=word.toLowerCase().trim();
  lastWord=word;hideSugg();showResult();

  _h('wordHero',`<div style="padding:16px 16px 12px"><div style="font-size:30px;font-weight:900;background:var(--grad);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${word}</div></div>`);
  _h('pronRow','');
  _h('secDict','<div class="spin-center" style="padding:40px"><div class="spinner"></div></div>');
  _h('secTrans','<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>');
  _h('secSyn','<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>');

  if(isOnline){
    try{
      const r=await fetch(DAPI+encodeURIComponent(word));
      if(!r.ok)throw 0;
      const data=await r.json();
      buildWordHero(data,word);buildPronRow(data);buildDictPane(data);buildSynPane(data);
      saveRecent(word);
    }catch{
      // Try offline fallback
      const offData=lookupOffline(word);
      if(offData){renderOfflineDict(word,offData);}
      else{
        _h('wordHero','');_h('pronRow','');
        _h('secDict',`<div class="err-box"><div class="err-icon">🔍</div><h3>Not found</h3><p>No results for "<strong>${word}</strong>"</p><button class="btn-grad" onclick="goHome()">← Home</button></div>`);
        _h('secTrans','');_h('secSyn','');
      }
    }
  }else{
    // OFFLINE MODE
    const offData=lookupOffline(word);
    if(offData){renderOfflineDict(word,offData);saveRecent(word);}
    else{
      _h('wordHero','');_h('pronRow','');
      _h('secDict',`<div class="err-box"><div class="err-icon">📵</div><h3>Word not in offline dictionary</h3><p>"<strong>${word}</strong>" requires internet connection.</p><div style="margin-top:12px;padding:12px;background:var(--surf2);border-radius:10px;font-size:13px;color:var(--T2)">💡 Offline dictionary contains 250+ common English words.</div></div>`);
      _h('secTrans','');_h('secSyn','');
    }
  }
  doTranslate(word);
}

function renderOfflineDict(word,data){
  _h('wordHero',`
    <div style="padding:16px 16px 12px">
      <div class="wh-top">
        <div class="wh-word">${word}</div>
        <div class="wh-acts">
          <button class="wh-act ${favs.includes(word)?'fav-on':''}" id="favBtn" onclick="toggleFav('${word}',this)">${favs.includes(word)?'❤️':'🤍'}</button>
        </div>
      </div>
      <span style="background:rgba(247,199,72,.15);color:var(--Y);border:1px solid rgba(247,199,72,.3);border-radius:50px;padding:3px 10px;font-size:11px;font-weight:700">📵 Offline</span>
    </div>`);
  _h('pronRow','');
  _h('secDict',`<div class="m-card">
    <div class="m-pos-row"><div class="m-pos">${data.pos}</div><div class="m-pos-line"></div></div>
    <div class="def-item">
      <div class="def-top"><div class="def-num">1</div><div class="def-txt">${data.def}</div></div>
      ${data.ex?`<div class="def-ex">${data.ex}</div>`:''}
    </div>
  </div>`);
  _h('secSyn','<div class="err-box" style="padding:20px"><p style="color:var(--T3)">Synonyms require internet connection.</p></div>');
}

function buildWordHero(data,word){
  const e=data[0];const isFav=favs.includes(word);
  const phs=e.phonetics?.filter(p=>p.audio)||[];
  _h('wordHero',`
    <div style="padding:16px 16px 12px">
      <div class="wh-top">
        <div class="wh-word">${e.word}</div>
        <div class="wh-acts">
          ${phs.length?`<button class="wh-act" onclick="playAudio('${phs[0].audio}')">🔊</button>`:''}
          <button class="wh-act ${isFav?'fav-on':''}" id="favBtn" onclick="toggleFav('${word}',this)">${isFav?'❤️':'🤍'}</button>
        </div>
      </div>
    </div>`);
}

function buildPronRow(data){
  const e=data[0];
  const phs=e.phonetics?.filter(p=>p.text||p.audio)||[];
  const uk=phs.find(p=>p.audio?.includes('-uk'))||phs[0];
  const us=phs.find(p=>p.audio?.includes('-us'))||phs[1];
  let h='';
  if(uk)h+=`<div class="pron-pill" onclick="playAudio('${uk.audio||''}')"><span class="pp-flag">🇬🇧</span><span class="pp-lbl">UK</span><span class="pp-ipa">${uk.text||''}</span><span class="pp-play">▶</span></div>`;
  if(us&&us!==uk)h+=`<div class="pron-pill" onclick="playAudio('${us.audio||''}')"><span class="pp-flag">🇺🇸</span><span class="pp-lbl">US</span><span class="pp-ipa">${us.text||''}</span><span class="pp-play">▶</span></div>`;
  _h('pronRow',h);
}

function buildDictPane(data){
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

function buildSynPane(data){
  const e=data[0];let syns=[],ants=[];
  e.meanings.forEach(m=>{
    syns=[...syns,...(m.synonyms||[])];
    ants=[...ants,...(m.antonyms||[])];
    m.definitions.forEach(d=>{syns=[...syns,...(d.synonyms||[])];ants=[...ants,...(d.antonyms||[])];});
  });
  syns=[...new Set(syns)].slice(0,16);
  ants=[...new Set(ants)].slice(0,16);
  let h='';
  if(syns.length)h+=`<div class="syn-card"><div class="syn-label">Synonyms</div><div class="syn-chips">${syns.map(s=>`<span class="syn-chip" onclick="search('${s}')">${s}</span>`).join('')}</div></div>`;
  if(ants.length)h+=`<div class="syn-card"><div class="syn-label">Antonyms</div><div class="syn-chips">${ants.map(a=>`<span class="syn-chip ant-chip" onclick="search('${a}')">${a}</span>`).join('')}</div></div>`;
  if(!syns.length&&!ants.length)h='<div class="err-box" style="padding:24px"><div style="font-size:32px;margin-bottom:8px">🔤</div><p>No synonyms found.</p></div>';
  _h('secSyn',h);
}

async function doTranslate(word){
  const tp=document.getElementById('secTrans');if(!tp)return;

  // Try offline first
  const offTrans=translateOffline(word,to.code);
  if(offTrans){
    tp.innerHTML=buildTransCard(offTrans,'📵 Offline translation');
    return;
  }

  if(!isOnline){
    tp.innerHTML=`<div class="err-box"><div class="err-icon">📵</div><h3>Offline</h3><p>Translation requires internet connection for this word.</p></div>`;
    return;
  }

  tp.innerHTML='<div class="spin-center" style="padding:32px"><div class="spinner"></div></div>';
  try{
    const r=await fetch(`${TAPI}?q=${encodeURIComponent(word)}&langpair=${from.code}|${to.code}`);
    const d=await r.json();
    tp.innerHTML=buildTransCard(d.responseData.translatedText,'');
  }catch{
    tp.innerHTML='<div class="err-box"><div class="err-icon">🌐</div><h3>Translation failed</h3><p>Check internet connection</p></div>';
  }
}

function buildTransCard(result,badge){
  return `<div class="trans-card">
    <div class="tc-lang">
      <span class="tc-flag">${to.flag}</span>
      <span class="tc-name">${to.name}</span>
      ${badge?`<span style="margin-left:auto;background:rgba(247,199,72,.15);color:var(--Y);border:1px solid rgba(247,199,72,.3);border-radius:50px;padding:2px 8px;font-size:10px;font-weight:700">${badge}</span>`:''}
    </div>
    <div class="tc-text" id="tcTxt">${result}</div>
    <div class="tc-acts">
      <button class="tc-btn" onclick="navigator.clipboard?.writeText(document.getElementById('tcTxt').textContent)">📋 Copy</button>
      <button class="tc-btn" onclick="openLang('to')">🌐 Change</button>
    </div>
  </div>`;
}

function showSection(s){
  ['dict','trans','syn'].forEach(x=>{
    _h=document.getElementById.bind(document);
    document.getElementById('sec'+x.charAt(0).toUpperCase()+x.slice(1)).style.display=x===s?'block':'none';
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

function playAudio(url){if(url)try{new Audio(url).play();}catch(e){}}

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
  const all=[...Object.keys(typeof OFFLINE_DICT!=='undefined'?OFFLINE_DICT:{}),...recent];
  const m=[...new Set(all.filter(w=>w.startsWith(val)))].slice(0,6);
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
  // Offline WOD fallback
  const off=typeof OFFLINE_DICT!=='undefined'?OFFLINE_DICT[word]:null;
  if(off){
    card.innerHTML=`<div class="wod-badge">📅 Word of the Day <span style="font-size:10px;opacity:.7">(offline)</span></div>
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
  if(!navigator.onLine)showNetBanner(true);
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
