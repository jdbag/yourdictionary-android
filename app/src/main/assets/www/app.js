const API='https://api.dictionaryapi.dev/api/v2/entries/en/';
let recent=JSON.parse(localStorage.getItem('yd_recent')||'[]');
let favs=JSON.parse(localStorage.getItem('yd_favs')||'[]');

function initTheme(){
  const t=localStorage.getItem('yd_theme')||'light';
  document.body.className=t;
  const b=document.getElementById('themeBtn');
  if(b)b.textContent=t==='dark'?'☀️':'🌙';
}
function toggleTheme(){
  const t=document.body.className==='dark'?'light':'dark';
  document.body.className=t;
  localStorage.setItem('yd_theme',t);
  const b=document.getElementById('themeBtn');
  if(b)b.textContent=t==='dark'?'☀️':'🌙';
}

function doSearch(word){
  const inp=document.getElementById('searchInput');
  if(word){if(inp)inp.value=word;}
  else{word=inp?.value.trim();}
  if(!word)return;
  word=word.toLowerCase().trim();
  hideSugg();
  document.getElementById('homeView').style.display='none';
  document.getElementById('resultView').style.display='block';
  document.getElementById('resultContent').innerHTML='<div class="result-container"><div class="center-spin" style="padding:60px"><div class="spin dark"></div></div></div>';
  fetch(API+encodeURIComponent(word))
    .then(r=>{if(!r.ok)throw 0;return r.json();})
    .then(d=>{renderResult(d,word);saveRecent(word);})
    .catch(()=>{
      document.getElementById('resultContent').innerHTML=`<div class="result-container"><div class="err-box"><div class="ico">🔍</div><h3>Not found</h3><p>We couldn't find "<strong>${word}</strong>". Check the spelling.</p><button class="btn-outline" onclick="goHome()">← Go Back</button></div></div>`;
    });
}

function renderResult(data,word){
  const e=data[0];
  const isFav=favs.includes(word);
  const phs=e.phonetics?.filter(p=>p.text||p.audio)||[];
  const uk=phs.find(p=>p.audio?.includes('-uk'))||phs[0];
  const us=phs.find(p=>p.audio?.includes('-us'))||phs[1];

  let h=`<div class="result-container">
    <button class="back-btn" onclick="goHome()">← Back</button>
    <div class="result-top">
      <div class="rw-row">
        <div class="rword">${e.word}</div>
        <div class="r-actions">
          ${(()=>{const a=phs.find(p=>p.audio);return a?`<button class="r-action" onclick="playAudio('${a.audio}')">🔊</button>`:''})()}
          <button class="r-action ${isFav?'active':''}" id="favBtn" onclick="toggleFav('${word}',this)">${isFav?'❤️':'🤍'}</button>
        </div>
      </div>
      <div class="ph-row">
        ${uk?`<div class="ph-item" onclick="playAudio('${uk.audio||''}')"><span class="ph-flag">🇬🇧</span><span class="ph-label">UK</span><span class="ph-text">${uk.text||''}</span><span class="ph-sound">▶</span></div>`:''}
        ${us&&us!==uk?`<div class="ph-item" onclick="playAudio('${us.audio||''}')"><span class="ph-flag">🇺🇸</span><span class="ph-label">US</span><span class="ph-text">${us.text||''}</span><span class="ph-sound">▶</span></div>`:''}
      </div>
    </div>`;

  e.meanings.forEach(m=>{
    h+=`<div class="meaning-card"><div class="m-pos">${m.partOfSpeech}</div>`;
    m.definitions.slice(0,4).forEach((d,i)=>{
      h+=`<div class="def-row"><div class="def-n">${i+1}.</div><div class="def-t">${d.definition}</div>${d.example?`<div class="def-e">"${d.example}"</div>`:''}</div>`;
    });
    h+=`</div>`;
    if(m.synonyms?.length){h+=`<div class="tags-card"><div class="tags-lbl">Synonyms</div><div class="tags-row">${m.synonyms.slice(0,8).map(s=>`<span class="wtag" onclick="doSearch('${s}')">${s}</span>`).join('')}</div></div>`;}
    if(m.antonyms?.length){h+=`<div class="tags-card"><div class="tags-lbl">Antonyms</div><div class="tags-row">${m.antonyms.slice(0,8).map(a=>`<span class="wtag ant" onclick="doSearch('${a}')">${a}</span>`).join('')}</div></div>`;}
  });
  h+=`</div>`;
  document.getElementById('resultContent').innerHTML=h;
  window.scrollTo(0,0);
}

function goHome(e){
  if(e)e.preventDefault();
  document.getElementById('homeView').style.display='block';
  document.getElementById('resultView').style.display='none';
  const inp=document.getElementById('searchInput');
  if(inp)inp.value='';
  const cb=document.getElementById('clearBtn');
  if(cb)cb.style.display='none';
  hideSugg();
}

function clearSearch(){
  const inp=document.getElementById('searchInput');
  if(inp)inp.value='';
  document.getElementById('clearBtn').style.display='none';
  hideSugg();
  goHome();
}

function playAudio(url){if(url)try{new Audio(url).play();}catch(e){}}

function toggleFav(word,btn){
  const i=favs.indexOf(word);
  if(i===-1){favs.push(word);btn.innerHTML='❤️';btn.classList.add('active');}
  else{favs.splice(i,1);btn.innerHTML='🤍';btn.classList.remove('active');}
  localStorage.setItem('yd_favs',JSON.stringify(favs));
}

function saveRecent(word){
  recent=[word,...recent.filter(w=>w!==word)].slice(0,12);
  localStorage.setItem('yd_recent',JSON.stringify(recent));
  renderRecent();
}
function clearRecent(){recent=[];localStorage.setItem('yd_recent','[]');renderRecent();}
function renderRecent(){
  const sec=document.getElementById('recentSec');
  const chips=document.getElementById('recentChips');
  if(!sec||!chips)return;
  if(!recent.length){sec.style.display='none';return;}
  sec.style.display='block';
  chips.innerHTML=recent.map(w=>`<button class="chip" onclick="doSearch('${w}')">${w}</button>`).join('');
}

function showSugg(val){
  const box=document.getElementById('suggBox');
  if(!box)return;
  const m=recent.filter(w=>w.startsWith(val)).slice(0,5);
  if(m.length){
    box.style.display='block';
    box.innerHTML=m.map(w=>`<div class="sugg-item" onclick="doSearch('${w}')"><span class="sugg-icon">🕐</span>${w}</div>`).join('');
  }else hideSugg();
}
function hideSugg(){const b=document.getElementById('suggBox');if(b){b.style.display='none';b.innerHTML='';}}

const wods=['ephemeral','serendipity','melancholy','resilience','eloquence','luminous','tenacious','labyrinth','solitude','whimsical'];
async function loadWOD(){
  const card=document.getElementById('wodCard');
  if(!card)return;
  const word=wods[new Date().getDate()%wods.length];
  try{
    const r=await fetch(API+word);
    const d=await r.json();
    const e=d[0];const def=e.meanings[0].definitions[0];
    card.innerHTML=`<div class="wod-badge">Word of the Day</div>
      <div class="wod-word">${e.word}</div>
      ${e.phonetic?`<div class="wod-ph">${e.phonetic}</div>`:''}
      <div class="wod-pos">${e.meanings[0].partOfSpeech}</div>
      <div class="wod-def">${def.definition}</div>
      ${def.example?`<div class="wod-ex">"${def.example}"</div>`:''}
      <button class="wod-btn" onclick="doSearch('${e.word}')">Explore word →</button>`;
  }catch{card.innerHTML='<div style="color:rgba(255,255,255,.6);padding:8px">Could not load.</div>';}
}

document.addEventListener('DOMContentLoaded',()=>{
  initTheme();renderRecent();loadWOD();
  const inp=document.getElementById('searchInput');
  const cb=document.getElementById('clearBtn');
  if(inp){
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')doSearch();});
    inp.addEventListener('input',()=>{
      const v=inp.value.trim();
      if(cb)cb.style.display=v?'block':'none';
      if(v.length>=2)showSugg(v);else hideSugg();
    });
    document.addEventListener('click',e=>{if(!inp.contains(e.target))hideSugg();});
  }
  const p=new URLSearchParams(window.location.search);
  if(p.get('word'))doSearch(p.get('word'));
});
