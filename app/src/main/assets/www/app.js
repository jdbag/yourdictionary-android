// ============================================================
// YOUR DICTIONARY - App Logic
// ============================================================

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

// ─── SEARCH ─────────────────────────────────────────────────
async function searchWord(word) {
  if (!word.trim()) return;
  word = word.trim().toLowerCase();

  const resultsSection = document.getElementById('resultsSection');
  const resultsContent = document.getElementById('resultsContent');
  const wodSection = document.getElementById('wodSection');

  if (!resultsSection) return;

  resultsSection.style.display = 'block';
  resultsContent.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Searching...</p></div>';
  if (wodSection) wodSection.style.display = 'none';

  try {
    const res = await fetch(API_BASE + encodeURIComponent(word));
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    renderResults(data, word);
    saveRecent(word);
  } catch {
    resultsContent.innerHTML = `
      <div class="error-card">
        <div class="error-icon">🔍</div>
        <h3>Word not found</h3>
        <p>We couldn't find "<strong>${word}</strong>". Try checking the spelling.</p>
        <button class="btn-secondary" onclick="clearResults()">Go Back</button>
      </div>`;
  }
}

function renderResults(data, word) {
  const resultsContent = document.getElementById('resultsContent');
  const entry = data[0];
  const isFav = favorites.includes(word);

  let html = `
    <div class="result-header">
      <div class="result-word-info">
        <h2 class="result-word">${entry.word}</h2>
        ${entry.phonetic ? `<span class="phonetic">${entry.phonetic}</span>` : ''}
        ${entry.phonetics?.find(p => p.audio) ? `
          <button class="audio-btn" onclick="playAudio('${entry.phonetics.find(p => p.audio).audio}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>` : ''}
      </div>
      <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFav('${word}', this)">
        <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        ${isFav ? 'Saved' : 'Save'}
      </button>
    </div>`;

  entry.meanings.forEach(meaning => {
    html += `
      <div class="meaning-block">
        <div class="pos-badge">${meaning.partOfSpeech}</div>
        <ol class="definitions-list">`;
    meaning.definitions.slice(0, 4).forEach(def => {
      html += `<li>
        <p class="def-text">${def.definition}</p>
        ${def.example ? `<p class="def-example">"${def.example}"</p>` : ''}
      </li>`;
    });
    html += `</ol>`;

    if (meaning.synonyms?.length) {
      html += `<div class="word-tags"><span class="tag-label">Synonyms:</span>`;
      meaning.synonyms.slice(0, 6).forEach(s => {
        html += `<span class="word-tag" onclick="searchWord('${s}')">${s}</span>`;
      });
      html += `</div>`;
    }
    if (meaning.antonyms?.length) {
      html += `<div class="word-tags"><span class="tag-label">Antonyms:</span>`;
      meaning.antonyms.slice(0, 6).forEach(a => {
        html += `<span class="word-tag antonym" onclick="searchWord('${a}')">${a}</span>`;
      });
      html += `</div>`;
    }
    html += `</div>`;
  });

  html += `<button class="btn-secondary back-btn" onclick="clearResults()">← Back to Home</button>`;
  document.getElementById('resultsContent').innerHTML = html;
  window.scrollTo(0, 0);
}

function clearResults() {
  const resultsSection = document.getElementById('resultsSection');
  const wodSection = document.getElementById('wodSection');
  if (resultsSection) resultsSection.style.display = 'none';
  if (wodSection) wodSection.style.display = 'block';
}

function playAudio(url) {
  new Audio(url).play().catch(() => {});
}

// ─── FAVORITES ───────────────────────────────────────────────
function toggleFav(word, btn) {
  const idx = favorites.indexOf(word);
  if (idx === -1) {
    favorites.push(word);
    btn.classList.add('active');
    btn.querySelector('svg').setAttribute('fill', 'currentColor');
    btn.lastChild.textContent = ' Saved';
  } else {
    favorites.splice(idx, 1);
    btn.classList.remove('active');
    btn.querySelector('svg').setAttribute('fill', 'none');
    btn.lastChild.textContent = ' Save';
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// ─── RECENT SEARCHES ─────────────────────────────────────────
function saveRecent(word) {
  recentSearches = recentSearches.filter(w => w !== word);
  recentSearches.unshift(word);
  recentSearches = recentSearches.slice(0, 8);
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  renderRecent();
}

function renderRecent() {
  const section = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!section || !list) return;
  if (recentSearches.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = recentSearches.map(w =>
    `<button class="recent-tag" onclick="searchWord('${w}')">${w}</button>`
  ).join('');
}

// ─── WORD OF THE DAY ─────────────────────────────────────────
const wordOfDayList = ['ephemeral','serendipity','melancholy','resilience','eloquence','luminous','tenacious','labyrinth','solitude','whimsical','ambiguous','profound','jubilant','zenith','cascade'];

async function loadWordOfDay() {
  const card = document.getElementById('wodCard');
  if (!card) return;
  const day = new Date().getDay();
  const word = wordOfDayList[day % wordOfDayList.length];
  try {
    const res = await fetch(API_BASE + word);
    const data = await res.json();
    const entry = data[0];
    const def = entry.meanings[0].definitions[0];
    card.innerHTML = `
      <div class="wod-inner">
        <div class="wod-word">${entry.word}</div>
        ${entry.phonetic ? `<div class="wod-phonetic">${entry.phonetic}</div>` : ''}
        <div class="wod-pos">${entry.meanings[0].partOfSpeech}</div>
        <p class="wod-def">${def.definition}</p>
        ${def.example ? `<p class="wod-example">"${def.example}"</p>` : ''}
        <button class="btn-primary" onclick="searchWord('${entry.word}')">Explore Word →</button>
      </div>`;
  } catch {
    card.innerHTML = `<p>Could not load word of the day.</p>`;
  }
}

// ─── SEARCH INPUT & SUGGESTIONS ──────────────────────────────
function setupSearch() {
  const input = document.getElementById('heroInput');
  const btn = document.getElementById('heroBtn');
  const suggestions = document.getElementById('suggestions');

  if (!input) return;

  btn?.addEventListener('click', () => { searchWord(input.value); if(window.onSearch) onSearch(); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { searchWord(input.value); if(window.onSearch) onSearch(); } });

  input.addEventListener('input', async () => {
    const val = input.value.trim();
    if (!suggestions) return;
    if (val.length < 2) { suggestions.innerHTML = ''; suggestions.style.display = 'none'; return; }
    // Simple prefix suggestions from recent
    const matches = recentSearches.filter(w => w.startsWith(val)).slice(0, 5);
    if (matches.length) {
      suggestions.style.display = 'block';
      suggestions.innerHTML = matches.map(w =>
        `<div class="suggestion-item" onclick="searchWord('${w}')">${w}</div>`
      ).join('');
    } else {
      suggestions.innerHTML = '';
      suggestions.style.display = 'none';
    }
  });

  document.addEventListener('click', e => {
    if (suggestions && !input.contains(e.target)) {
      suggestions.style.display = 'none';
    }
  });
}

// ─── MOBILE NAV ──────────────────────────────────────────────
function setupMobileNav() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// ─── CATEGORY CARDS ──────────────────────────────────────────
function setupCategories() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      const word = card.dataset.word;
      if (word) searchWord(word);
    });
  });
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupMobileNav();
  setupCategories();
  renderRecent();
  loadWordOfDay();
});
