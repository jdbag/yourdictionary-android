const API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// ─── SEARCH ─────────────────────────────────────────────────
async function searchWord(word) {
  if (!word.trim()) return;
  word = word.trim().toLowerCase();
  const rs = document.getElementById('resultsSection');
  const rc = document.getElementById('resultsContent');
  const hc = document.getElementById('homeContent');
  if (!rs) return;
  rs.style.display = 'block';
  if (hc) hc.style.display = 'none';
  rc.innerHTML = '<div class="page-wrap"><div style="text-align:center;padding:40px"><div class="spinner dark" style="margin:0 auto"></div></div></div>';
  try {
    const res = await fetch(API + encodeURIComponent(word));
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderResults(data, word);
    saveRecent(word);
  } catch {
    rc.innerHTML = `<div class="page-wrap"><div class="error-card"><div class="icon">🔍</div><h3>Not found</h3><p>We couldn't find "<strong>${word}</strong>".</p><button class="btn-primary" onclick="clearResults()">Go Back</button></div></div>`;
  }
}

function renderResults(data, word) {
  const entry = data[0];
  const isFav = favorites.includes(word);
  let html = `<div class="page-wrap">
    <div class="result-header">
      <div>
        <div class="result-word">${entry.word}</div>
        ${entry.phonetic ? `<div class="phonetic">${entry.phonetic}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
        ${entry.phonetics?.find(p=>p.audio) ? `<button class="audio-btn" onclick="playAudio('${entry.phonetics.find(p=>p.audio).audio}')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>` : ''}
        <button class="fav-btn ${isFav?'active':''}" id="favBtn" onclick="toggleFav('${word}',this)">
          <svg viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          ${isFav?'Saved':'Save'}
        </button>
      </div>
    </div>`;

  entry.meanings.forEach(m => {
    html += `<div class="meaning-block"><div class="pos-badge">${m.partOfSpeech}</div><ol class="definitions-list">`;
    m.definitions.slice(0, 4).forEach(d => {
      html += `<li><p class="def-text">${d.definition}</p>${d.example ? `<p class="def-example">"${d.example}"</p>` : ''}</li>`;
    });
    html += `</ol>`;
    if (m.synonyms?.length) {
      html += `<div class="word-tags"><span class="tag-label">Syn:</span>${m.synonyms.slice(0,6).map(s=>`<span class="word-tag" onclick="searchWord('${s}')">${s}</span>`).join('')}</div>`;
    }
    if (m.antonyms?.length) {
      html += `<div class="word-tags"><span class="tag-label">Ant:</span>${m.antonyms.slice(0,6).map(a=>`<span class="word-tag antonym" onclick="searchWord('${a}')">${a}</span>`).join('')}</div>`;
    }
    html += `</div>`;
  });

  html += `<button class="btn-secondary back-btn" onclick="clearResults()">← Back</button></div>`;
  document.getElementById('resultsContent').innerHTML = html;
  window.scrollTo(0, 0);
}

function clearResults() {
  const rs = document.getElementById('resultsSection');
  const hc = document.getElementById('homeContent');
  if (rs) rs.style.display = 'none';
  if (hc) hc.style.display = 'block';
}

function playAudio(url) { try { new Audio(url).play(); } catch(e){} }

function toggleFav(word, btn) {
  const idx = favorites.indexOf(word);
  if (idx === -1) {
    favorites.push(word);
    btn.classList.add('active');
    btn.querySelector('svg').setAttribute('fill','currentColor');
    btn.childNodes[btn.childNodes.length-1].textContent = ' Saved';
  } else {
    favorites.splice(idx, 1);
    btn.classList.remove('active');
    btn.querySelector('svg').setAttribute('fill','none');
    btn.childNodes[btn.childNodes.length-1].textContent = ' Save';
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ─── RECENT ──────────────────────────────────────────────────
function saveRecent(word) {
  recentSearches = [word, ...recentSearches.filter(w=>w!==word)].slice(0,8);
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  renderRecent();
}

function renderRecent() {
  const sec = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!sec || !list) return;
  if (!recentSearches.length) { sec.style.display='none'; return; }
  sec.style.display = 'block';
  list.innerHTML = recentSearches.map(w=>`<button class="recent-tag" onclick="searchWord('${w}')">${w}</button>`).join('');
}

// ─── WORD OF DAY ──────────────────────────────────────────────
const wods = ['ephemeral','serendipity','melancholy','resilience','eloquence','luminous','tenacious','labyrinth','solitude','whimsical','ambiguous','profound','jubilant','zenith','cascade'];

async function loadWOD() {
  const card = document.getElementById('wodCard');
  if (!card) return;
  const word = wods[new Date().getDay() % wods.length];
  try {
    const res = await fetch(API + word);
    const data = await res.json();
    const e = data[0]; const d = e.meanings[0].definitions[0];
    card.innerHTML = `
      <div class="wod-word">${e.word}</div>
      ${e.phonetic?`<div class="wod-phonetic">${e.phonetic}</div>`:''}
      <div class="wod-pos">${e.meanings[0].partOfSpeech}</div>
      <p class="wod-def">${d.definition}</p>
      ${d.example?`<p class="wod-example">"${d.example}"</p>`:''}
      <button class="btn-primary" onclick="searchWord('${e.word}')">Explore →</button>`;
  } catch { card.innerHTML = '<p style="color:rgba(255,255,255,0.7)">Could not load.</p>'; }
}

// ─── SETUP ───────────────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById('heroInput');
  const btn = document.getElementById('heroBtn');
  const sugg = document.getElementById('suggestions');
  if (!input) return;
  btn?.addEventListener('click', () => searchWord(input.value));
  input.addEventListener('keydown', e => { if(e.key==='Enter') searchWord(input.value); });
  input.addEventListener('input', () => {
    const v = input.value.trim();
    if (!sugg) return;
    if (v.length < 2) { sugg.innerHTML=''; sugg.style.display='none'; return; }
    const matches = recentSearches.filter(w=>w.startsWith(v)).slice(0,5);
    if (matches.length) {
      sugg.style.display = 'block';
      sugg.innerHTML = matches.map(w=>`<div class="suggestion-item" onclick="searchWord('${w}')">${w}</div>`).join('');
    } else { sugg.innerHTML=''; sugg.style.display='none'; }
  });
  document.addEventListener('click', e => { if(sugg && !input.contains(e.target)) { sugg.style.display='none'; } });
}

function setupMobileNav() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  if (btn && nav) btn.addEventListener('click', () => nav.classList.toggle('open'));
}

function setupCategories() {
  document.querySelectorAll('.cat-card').forEach(c => {
    c.addEventListener('click', () => searchWord(c.dataset.word));
  });
}

// Check URL params for word
function checkUrlWord() {
  const params = new URLSearchParams(window.location.search);
  const w = params.get('word');
  if (w) searchWord(w);
}

document.addEventListener('DOMContentLoaded', () => {
  setupSearch(); setupMobileNav(); setupCategories();
  renderRecent(); loadWOD(); checkUrlWord();
});
