const API='https://api.dictionaryapi.dev/api/v2/entries/en/';
let recent=JSON.parse(localStorage.getItem('yd_r')||'[]');
let favs=JSON.parse(localStorage.getItem('yd_f')||'[]');
let currentLang={from:{code:'en',name:'English',flag:'🇬🇧'},to:{code:'ar',name:'Arabic',flag:'🇸🇦'}};
let langPickerTarget='from';

const LANGS=[
  {code:'en',name:'English',flag:'🇬🇧'},{code:'ar',name:'Arabic',flag:'🇸🇦'},
  {code:'fr',name:'French',flag:'🇫🇷'},{code:'es',name:'Spanish',flag:'🇪🇸'},
  {code:'de',name:'German',flag:'🇩🇪'},{code:'it',name:'Italian',flag:'🇮🇹'},
  {code:'pt',name:'Portuguese',flag:'🇧🇷'},{code:'ru',name:'Russian',flag:'🇷🇺'},
  {code:'zh',name:'Chinese',flag:'🇨🇳'},{code:'ja',name:'Japanese',flag:'🇯🇵'},
  {code:'ko',name:'Korean',flag:'🇰🇷'},{code:'tr',name:'Turkish',flag:'🇹🇷'},
  {code:'hi',name:'Hindi',flag:'🇮🇳'},
];

// THEME
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

// LANG PICKER
function openLangPicker(target){
  langPickerTarget=target;
  const list=document.getElementById('langList');
  if(!list)return;
  const cur=target==='from'?currentLang.from.code:currentLang.to.code;
  list.innerHTML=LANGS.map(l=>`
    <div class="lang-option ${l.code===cur?'selected':''}" onclick="selectLang('${l.code}','${l.name}','${l.flag}')">
      <span style="font-size:20px">${l.flag}</span>
      <span>${l.name}</span>
      ${l.code===cur?'<span style="margin-left:auto;color:var(--primary)">✓</span>':''}
    </div>`).join('');
  document.getElementById('langModal').style.display='flex';
}
function closeLangPicker(){document.getElementById('langModal').style.display='none';}
function selectLang(code,name,flag){
  if(langPickerTarget==='from'){
    currentLang.from={code,name,flag};
    const fb=document.getElementById('fromFlag'),fn=document.getElementById('fromName');
    if(fb)fb.textContent=flag;if(fn)fn.textContent=name;
  }else{
    currentLang.to={code,name,flag};
    const tf=document.getElementById('toFlag'),tn=document.getElementById('toName');
    if(tf)tf.textContent=flag;if(tn)tn.textContent=name;
  }
  closeLangPicker();
}
function swapLangs(){
  const tmp=currentLang.from;currentLang.from=currentLang.to;currentLang.to=tmp;
  const fb=document.getElementById('fromFlag'),fn=document.getElementById('fromName');
  const tf=document.getElementById('toFlag'),tn=document.getElementById('toName');
  if(fb)fb.textContent=currentLang.from.flag;if(fn)fn.textContent=currentLang.from.name;
  if(tf)tf.textContent=currentLang.to.flag;if(tn)tn.textContent=currentLang.to.name;
}

// SEARCH
async function doSearch(word){
  const inp=document.getElementById('mainInput');
  if(word){if(inp)inp.value=word;}
  else{word=inp?.value.trim();}
  if(!word)return;
  word=word.toLowerCase().trim();
  hideSugg();
  showResultArea();
  showTab('dict');
  document.getElementById('dictResult').innerHTML='<div class="loading-c" style="padding:40px"><div class="spin"></div></div>';
  try{
    const r=await fetch(API+encodeURIComponent(word));
    if(!r.ok)throw 0;
    const d=await r.json();
    renderDict(d,word);saveRecent(word);
  }catch{
    document.getElementById('dictResult').innerHTML=`<div class="err-card"><div class="err-ico">🔍</div><h3>Not found</h3><p>No results for "<strong>${word}</strong>"</p><button class="btn-primary" style="max-width:160px;margin:0 auto" onclick="hideResultArea()">Go Back</button></div>`;
  }
  // Also translate automatically
  doTranslate(word);
}

function renderDict(data,word){
  const e=data[0];const isFav=favs.includes(word);
  const phs=e.phonetics?.filter(p=>p.text||p.audio)||[];
  const uk=phs.find(p=>p.audio?.includes('-uk'))||phs[0];
  const us=phs.find(p=>p.audio?.includes('-us'))||phs[1];
  let h=`<div class="dict-header">
    <div class="dict-word-row">
      <div class="dict-word">${e.word}</div>
      <div class="dict-acts">
        ${(()=>{const a=phs.find(p=>p.audio);return a?`<button class="dact" onclick="playAudio('${a.audio}')">🔊</button>`:''})()}
        <button class="dact ${isFav?'fav-on':''}" id="favBtn" onclick="toggleFav('${word}',this)">${isFav?'❤️':'🤍'}</button>
      </div>
    </div>
    <div class="ph-chips">
      ${uk?`<div class="ph-chip" onclick="playAudio('${uk.audio||''}')"><span class="ph-cc">🇬🇧</span><span class="ph-lbl">UK</span><span class="ph-ipa">${uk.text||''}</span><span class="ph-play">▶</span></div>`:''}
      ${us&&us!==uk?`<div class="ph-chip" onclick="playAudio('${us.audio||''}')"><span class="ph-cc">🇺🇸</span><span class="ph-lbl">US</span><span class="ph-ipa">${us.text||''}</span><span class="ph-play">▶</span></div>`:''}
    </div>
  </div>`;
  e.meanings.forEach(m=>{
    h+=`<div class="meaning-card"><div class="mpos">${m.partOfSpeech}</div>`;
    m.definitions.slice(0,4).forEach((d,i)=>{
      h+=`<div class="def-item"><div class="def-num">${i+1}.</div><div class="def-txt">${d.definition}</div>${d.example?`<div class="def-ex">"${d.example}"</div>`:''}</div>`;
    });
    h+=`</div>`;
    if(m.synonyms?.length){h+=`<div class="tags-card"><div class="tags-lbl">Synonyms</div><div class="tags-row">${m.synonyms.slice(0,8).map(s=>`<span class="wtag" onclick="doSearch('${s}')">${s}</span>`).join('')}</div></div>`;}
    if(m.antonyms?.length){h+=`<div class="tags-card"><div class="tags-lbl">Antonyms</div><div class="tags-row">${m.antonyms.slice(0,8).map(a=>`<span class="wtag" onclick="doSearch('${a}')">${a}</span>`).join('')}</div></div>`;}
  });
  document.getElementById('dictResult').innerHTML=h;
}

async function doTranslate(word){
  const inp=document.getElementById('mainInput');
  const text=word||inp?.value.trim();
  if(!text)return;
  const tr=document.getElementById('transResult');
  if(!tr)return;
  tr.innerHTML='<div class="loading-c"><div class="spin"></div></div>';
  showResultArea();
  try{
    const from=currentLang.from.code,to=currentLang.to.code;
    const r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`);
    const d=await r.json();
    const result=d.responseData.translatedText;
    tr.innerHTML=`<div class="trans-card">
      <div class="trans-lbl">${currentLang.to.flag} ${currentLang.to.name}</div>
      <div class="trans-txt" id="transText">${result}</div>
      <div class="trans-acts">
        <button onclick="navigator.clipboard?.writeText(document.getElementById('transText').textContent)">📋 Copy</button>
        <button onclick="doSearch('${text}')">📖 Dictionary</button>
      </div>
    </div>`;
  }catch{
    tr.innerHTML='<div class="err-card"><div class="err-ico">🌐</div><h3>Translation failed</h3><p>Check internet connection</p></div>';
  }
}

function showResultArea(){
  document.getElementById('resultArea').style.display='block';
  document.getElementById('homeContent').style.display='none';
}
function hideResultArea(){
  document.getElementById('resultArea').style.display='none';
  document.getElementById('homeContent').style.display='block';
  const inp=document.getElementById('mainInput');
  if(inp)inp.value='';updateClearBtn();
}
function showTab(tab){
  document.getElementById('dictResult').style.display=tab==='dict'?'block':'none';
  document.getElementById('transResult').style.display=tab==='trans'?'block':'none';
  document.getElementById('dictTab').classList.toggle('active',tab==='dict');
  document.getElementById('transTab').classList.toggle('active',tab==='trans');
}

function clearMain(){
  const inp=document.getElementById('mainInput');
  if(inp)inp.value='';updateClearBtn();hideSugg();hideResultArea();
}
function updateClearBtn(){
  const inp=document.getElementById('mainInput');
  const cb=document.getElementById('clearX');
  if(cb)cb.style.display=inp?.value.trim()?'block':'none';
}

function playAudio(url){if(url)try{new Audio(url).play();}catch(e){}}

function toggleFav(word,btn){
  const i=favs.indexOf(word);
  if(i===-1){favs.push(word);btn.innerHTML='❤️';btn.classList.add('fav-on');}
  else{favs.splice(i,1);btn.innerHTML='🤍';btn.classList.remove('fav-on');}
  localStorage.setItem('yd_f',JSON.stringify(favs));
}

function saveRecent(word){
  recent=[word,...recent.filter(w=>w!==word)].slice(0,12);
  localStorage.setItem('yd_r',JSON.stringify(recent));renderRecent();
}
function clearRecent(){recent=[];localStorage.setItem('yd_r','[]');renderRecent();}
function renderRecent(){
  const b=document.getElementById('recentBlock'),c=document.getElementById('recentChips');
  if(!b||!c)return;
  if(!recent.length){b.style.display='none';return;}
  b.style.display='block';
  c.innerHTML=recent.map(w=>`<button class="chip" onclick="doSearch('${w}')">${w}</button>`).join('');
}

function showSugg(val){
  const box=document.getElementById('suggList');if(!box)return;
  const m=recent.filter(w=>w.startsWith(val)).slice(0,5);
  if(m.length){
    box.style.display='block';
    box.innerHTML=m.map(w=>`<div class="sugg-item" onclick="doSearch('${w}')"><span class="sugg-ic">🕐</span>${w}</div>`).join('');
  }else hideSugg();
}
function hideSugg(){const b=document.getElementById('suggList');if(b){b.style.display='none';b.innerHTML='';}}

const wods=['ephemeral','serendipity','melancholy','resilience','eloquence','luminous','tenacious','labyrinth','solitude','whimsical'];
async function loadWOD(){
  const card=document.getElementById('wodCard');if(!card)return;
  const word=wods[new Date().getDate()%wods.length];
  try{
    const r=await fetch(API+word);const d=await r.json();const e=d[0];const def=e.meanings[0].definitions[0];
    card.innerHTML=`<div class="wod-badge">📅 Word of the Day</div>
      <div class="wod-word">${e.word}</div>
      ${e.phonetic?`<div class="wod-ph">${e.phonetic}</div>`:''}
      <div class="wod-pos">${e.meanings[0].partOfSpeech}</div>
      <div class="wod-def">${def.definition}</div>
      ${def.example?`<div class="wod-ex">"${def.example}"</div>`:''}
      <button class="wod-btn" onclick="doSearch('${e.word}')">Explore →</button>`;
  }catch{card.innerHTML='<div style="color:var(--text3);padding:8px;text-align:center">Could not load</div>';}
}

document.addEventListener('DOMContentLoaded',()=>{
  initTheme();renderRecent();loadWOD();
  const inp=document.getElementById('mainInput');
  if(inp){
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
    inp.addEventListener('input',()=>{
      updateClearBtn();
      const v=inp.value.trim();
      if(v.length>=2)showSugg(v);else hideSugg();
    });
    document.addEventListener('click',e=>{if(!inp.contains(e.target))hideSugg();});
  }
  const p=new URLSearchParams(window.location.search);
  if(p.get('word'))doSearch(p.get('word'));
});
