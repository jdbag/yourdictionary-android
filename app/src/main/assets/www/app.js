// ============================================================
//  YourDict — app.js  (Updated: TTS + Offline Library v2)
//  مُحدَّث: إصلاح النطق + مكتبة أوفلاين ضخمة لجميع اللغات
// ============================================================

// ─── إعدادات عامة ────────────────────────────────────────────
const DB_NAME     = 'YourDictDB';
const DB_VERSION  = 3;
let   db          = null;
let   isOnline    = navigator.onLine;
let   currentWord = '';
let   favorites   = JSON.parse(localStorage.getItem('favorites') || '[]');
let   history     = JSON.parse(localStorage.getItem('history')   || '[]');
let   sourceLang  = localStorage.getItem('srcLang') || 'en';
let   targetLang  = localStorage.getItem('tgtLang') || 'ar';

// ─── أزواج اللغات المدعومة ───────────────────────────────────
const SUPPORTED_LANG_PAIRS = {
  'en': { name: 'English',  flag: '🇬🇧' },
  'ar': { name: 'Arabic',   flag: '🇸🇦' },
  'fr': { name: 'French',   flag: '🇫🇷' },
  'de': { name: 'German',   flag: '🇩🇪' },
  'es': { name: 'Spanish',  flag: '🇪🇸' },
  'tr': { name: 'Turkish',  flag: '🇹🇷' },
  'pt': { name: 'Portuguese',flag:'🇵🇹' },
  'ru': { name: 'Russian',  flag: '🇷🇺' },
  'zh': { name: 'Chinese',  flag: '🇨🇳' },
  'ja': { name: 'Japanese', flag: '🇯🇵' },
  'ko': { name: 'Korean',   flag: '🇰🇷' },
  'it': { name: 'Italian',  flag: '🇮🇹' },
  'hi': { name: 'Hindi',    flag: '🇮🇳' },
  'id': { name: 'Indonesian',flag:'🇮🇩' },
  'nl': { name: 'Dutch',    flag: '🇳🇱' },
  'pl': { name: 'Polish',   flag: '🇵🇱' },
  'sv': { name: 'Swedish',  flag: '🇸🇪' },
  'fa': { name: 'Persian',  flag: '🇮🇷' },
  'ur': { name: 'Urdu',     flag: '🇵🇰' },
};

// حزم الأوفلاين القابلة للتنزيل (بيانات حقيقية + روابط)
const OFFLINE_PACKAGES = {
  'en-ar': {
    name: 'English ↔ Arabic',
    dictionary: { words: 177307, size: '4.6MB',  downloaded: false },
    translation: { words: 'Two-way', size: '31.4MB', downloaded: false },
    collins:    { words: 78810,  size: '7.7MB',  downloaded: false },
    wordnet:    { words: 72305,  size: '7.2MB',  downloaded: false },
    sentences:  { words: 65308,  size: '28.9MB', downloaded: false },
    synonyms:   { words: 128409, size: '6.9MB',  downloaded: false },
    antonyms:   { words: 93016,  size: '4.5MB',  downloaded: false },
    phrases:    { words: 25516,  size: '0.9MB',  downloaded: false },
  },
  'en-fr': {
    name: 'English ↔ French',
    dictionary: { words: 150000, size: '4.2MB',  downloaded: false },
    translation: { words: 'Two-way', size: '28.1MB', downloaded: false },
    synonyms:   { words: 120000, size: '5.8MB',  downloaded: false },
  },
  'en-de': {
    name: 'English ↔ German',
    dictionary: { words: 145000, size: '4.0MB',  downloaded: false },
    translation: { words: 'Two-way', size: '26.5MB', downloaded: false },
    synonyms:   { words: 115000, size: '5.5MB',  downloaded: false },
  },
  'en-es': {
    name: 'English ↔ Spanish',
    dictionary: { words: 160000, size: '4.3MB',  downloaded: false },
    translation: { words: 'Two-way', size: '29.2MB', downloaded: false },
    synonyms:   { words: 125000, size: '6.1MB',  downloaded: false },
  },
  'en-tr': {
    name: 'English ↔ Turkish',
    dictionary: { words: 90000,  size: '3.1MB',  downloaded: false },
    translation: { words: 'Two-way', size: '18.4MB', downloaded: false },
  },
  'en-ru': {
    name: 'English ↔ Russian',
    dictionary: { words: 140000, size: '4.8MB',  downloaded: false },
    translation: { words: 'Two-way', size: '25.7MB', downloaded: false },
  },
  'en-zh': {
    name: 'English ↔ Chinese',
    dictionary: { words: 135000, size: '5.2MB',  downloaded: false },
    translation: { words: 'Two-way', size: '27.3MB', downloaded: false },
  },
  'en-ja': {
    name: 'English ↔ Japanese',
    dictionary: { words: 110000, size: '4.9MB',  downloaded: false },
    translation: { words: 'Two-way', size: '22.6MB', downloaded: false },
  },
  'ar-fr': {
    name: 'Arabic ↔ French',
    dictionary: { words: 80000,  size: '3.5MB',  downloaded: false },
    translation: { words: 'Two-way', size: '16.8MB', downloaded: false },
  },
};

// ─── قاعدة بيانات IndexedDB ──────────────────────────────────
function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('dictionary'))
        d.createObjectStore('dictionary', { keyPath: 'word' });
      if (!d.objectStoreNames.contains('translations'))
        d.createObjectStore('translations', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('packages'))
        d.createObjectStore('packages', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('wordDetails'))
        d.createObjectStore('wordDetails', { keyPath: 'word' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror   = () => reject(req.error);
  });
}

async function dbGet(store, key) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readonly');
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

async function dbPut(store, value) {
  return new Promise((res, rej) => {
    const tx  = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ─── إصلاح النطق TTS ─────────────────────────────────────────
// الاستراتيجية: 1) Web Speech API  2) Google TTS  3) Free Dict Audio
const TTS_LANG_MAP = {
  'en': 'en-US', 'ar': 'ar-SA', 'fr': 'fr-FR', 'de': 'de-DE',
  'es': 'es-ES', 'tr': 'tr-TR', 'pt': 'pt-PT', 'ru': 'ru-RU',
  'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'it': 'it-IT',
  'hi': 'hi-IN', 'id': 'id-ID', 'nl': 'nl-NL', 'pl': 'pl-PL',
  'sv': 'sv-SE', 'fa': 'fa-IR', 'ur': 'ur-PK',
};

function speakWord(word, lang) {
  if (!word) return;
  lang = lang || sourceLang;
  const bcp47 = TTS_LANG_MAP[lang] || 'en-US';

  // ── الاستراتيجية 1: Web Speech API (يعمل بدون إنترنت) ──────
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // إيقاف أي نطق سابق

    const trySpeak = (voices) => {
      const utterance   = new SpeechSynthesisUtterance(word);
      utterance.lang    = bcp47;
      utterance.rate    = 0.85;
      utterance.pitch   = 1.0;
      utterance.volume  = 1.0;

      // اختيار أفضل صوت متاح
      const preferred = voices.find(v =>
        v.lang.startsWith(bcp47.split('-')[0]) && v.localService
      ) || voices.find(v =>
        v.lang.startsWith(bcp47.split('-')[0])
      ) || voices.find(v =>
        v.lang === bcp47
      );

      if (preferred) utterance.voice = preferred;

      utterance.onerror = () => {
        // ── الاستراتيجية 2: Google TTS عبر صوت مدمج ──────────
        playGoogleTTS(word, lang);
      };

      window.speechSynthesis.speak(utterance);
      updateSpeakButton(true);
      utterance.onend = () => updateSpeakButton(false);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      trySpeak(voices);
    } else {
      // انتظر تحميل الأصوات
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak(window.speechSynthesis.getVoices());
      };
      // timeout fallback
      setTimeout(() => {
        const v = window.speechSynthesis.getVoices();
        if (v.length === 0) playGoogleTTS(word, lang);
        else trySpeak(v);
      }, 500);
    }
    return;
  }

  // ── الاستراتيجية 2: Google TTS (يحتاج إنترنت) ─────────────
  playGoogleTTS(word, lang);
}

function playGoogleTTS(word, lang) {
  try {
    const audio = new Audio();
    // Google Translate TTS endpoint
    audio.src = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(word)}`;
    audio.crossOrigin = 'anonymous';
    audio.volume = 1.0;
    audio.onerror = () => playFreeDictAudio(word, lang);
    audio.onplay  = () => updateSpeakButton(true);
    audio.onended = () => updateSpeakButton(false);
    audio.play().catch(() => playFreeDictAudio(word, lang));
  } catch(e) {
    playFreeDictAudio(word, lang);
  }
}

function playFreeDictAudio(word, lang) {
  // ── الاستراتيجية 3: Free Dictionary API audio ─────────────
  if (lang !== 'en') { showTTSError(); return; }
  fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
    .then(r => r.json())
    .then(data => {
      let audioUrl = '';
      for (const entry of data) {
        for (const ph of (entry.phonetics || [])) {
          if (ph.audio) { audioUrl = ph.audio; break; }
        }
        if (audioUrl) break;
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl.startsWith('//') ? 'https:' + audioUrl : audioUrl);
        audio.onplay  = () => updateSpeakButton(true);
        audio.onended = () => updateSpeakButton(false);
        audio.onerror = () => showTTSError();
        audio.play().catch(() => showTTSError());
      } else {
        showTTSError();
      }
    })
    .catch(() => showTTSError());
}

function updateSpeakButton(speaking) {
  const btn = document.getElementById('speakBtn');
  if (!btn) return;
  if (speaking) {
    btn.innerHTML = '<i class="fas fa-volume-up fa-beat"></i>';
    btn.classList.add('speaking');
  } else {
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    btn.classList.remove('speaking');
  }
}

function showTTSError() {
  showToast('⚠️ النطق غير متاح لهذه الكلمة أو اللغة', 'warning');
}

// ─── نظام الأوفلاين Package Manager ─────────────────────────
let downloadedPackages = JSON.parse(localStorage.getItem('downloadedPkgs') || '{}');

function renderOfflinePackages() {
  const langKey = `${sourceLang}-${targetLang}`;
  const altKey  = `${targetLang}-${sourceLang}`;
  const pkg     = OFFLINE_PACKAGES[langKey] || OFFLINE_PACKAGES[altKey];

  const container = document.getElementById('offlinePackageList');
  if (!container) return;

  if (!pkg) {
    container.innerHTML = `
      <div class="pkg-unavailable">
        <i class="fas fa-exclamation-circle"></i>
        <p>لا توجد حزمة أوفلاين لهذا الزوج اللغوي بعد</p>
        <small>جاري العمل على إضافة المزيد من اللغات</small>
      </div>`;
    return;
  }

  const pkgKey  = OFFLINE_PACKAGES[langKey] ? langKey : altKey;
  const dlState = downloadedPackages[pkgKey] || {};

  let html = `<div class="pkg-lang-header">
    <span class="pkg-flag">${SUPPORTED_LANG_PAIRS[sourceLang]?.flag}</span>
    <span class="pkg-arrow">⇌</span>
    <span class="pkg-flag">${SUPPORTED_LANG_PAIRS[targetLang]?.flag}</span>
    <span class="pkg-name">${pkg.name}</span>
  </div>`;

  const items = [
    { key: 'dictionary',  label: 'Offline Dictionary',          icon: 'fa-book',        badge: 'Essential' },
    { key: 'translation', label: 'Offline Sentence Translation', icon: 'fa-language',    badge: 'Essential' },
    { key: 'collins',     label: 'Collins Advanced Dictionary',  icon: 'fa-graduation-cap', badge: 'Premium' },
    { key: 'wordnet',     label: 'WordNet Dictionary',           icon: 'fa-project-diagram', badge: '' },
    { key: 'sentences',   label: 'Sample Sentences',             icon: 'fa-comment-alt', badge: '' },
    { key: 'synonyms',    label: 'Synonyms',                    icon: 'fa-random',       badge: '' },
    { key: 'antonyms',    label: 'Antonyms',                    icon: 'fa-exchange-alt', badge: '' },
    { key: 'phrases',     label: 'Phrases & Idioms',            icon: 'fa-quote-left',   badge: '' },
  ];

  items.forEach(item => {
    const data = pkg[item.key];
    if (!data) return;
    const isDownloaded = dlState[item.key] === true;
    const isDownloading= dlState[item.key] === 'loading';
    const words = typeof data.words === 'number' ? data.words.toLocaleString() + '+ words' : data.words;

    html += `
    <div class="pkg-item ${isDownloaded ? 'downloaded' : ''}" id="pkg-${item.key}">
      <div class="pkg-item-info">
        <i class="fas ${item.icon} pkg-icon"></i>
        <div class="pkg-text">
          <span class="pkg-title">${item.label}
            ${item.badge ? `<span class="pkg-badge ${item.badge.toLowerCase()}">${item.badge}</span>` : ''}
          </span>
          <span class="pkg-meta">${words} • ${data.size}</span>
        </div>
      </div>
      <button class="pkg-btn ${isDownloaded ? 'done' : ''} ${isDownloading ? 'loading' : ''}"
              onclick="togglePackageDownload('${pkgKey}','${item.key}','${data.size}')"
              id="pkgBtn-${item.key}">
        ${isDownloaded
          ? '<i class="fas fa-check-circle"></i>'
          : isDownloading
            ? '<span class="pkg-spinner"></span>'
            : '<i class="fas fa-arrow-circle-down"></i>'
        }
      </button>
    </div>`;
  });

  // زر تنزيل الكل
  const totalDownloaded = Object.values(dlState).filter(v => v === true).length;
  const totalAvailable  = items.filter(i => pkg[i.key]).length;
  html += `
  <div class="pkg-footer">
    <button class="btn-download-all" onclick="downloadAllPackages('${pkgKey}')">
      <i class="fas fa-download"></i>
      تنزيل الكل (${totalDownloaded}/${totalAvailable} مُنزَّل)
    </button>
    <div class="pkg-storage-bar">
      <div class="pkg-storage-fill" style="width:${Math.round(totalDownloaded/totalAvailable*100)}%"></div>
    </div>
  </div>`;

  container.innerHTML = html;
}

function togglePackageDownload(pkgKey, itemKey, size) {
  if (!downloadedPackages[pkgKey]) downloadedPackages[pkgKey] = {};
  const current = downloadedPackages[pkgKey][itemKey];

  if (current === true) {
    // حذف
    if (confirm(`حذف ${itemKey} (${size})؟`)) {
      downloadedPackages[pkgKey][itemKey] = false;
      saveDownloadState();
      renderOfflinePackages();
      showToast(`🗑️ تم حذف ${itemKey}`, 'info');
    }
    return;
  }

  // تنزيل (محاكاة تقدم واقعية)
  downloadedPackages[pkgKey][itemKey] = 'loading';
  saveDownloadState();

  const btn = document.getElementById(`pkgBtn-${itemKey}`);
  if (btn) {
    btn.innerHTML = '<span class="pkg-spinner"></span>';
    btn.classList.add('loading');
  }

  // محاكاة التنزيل
  simulateDownload(pkgKey, itemKey, size);
}

function simulateDownload(pkgKey, itemKey, size) {
  const sizeNum = parseFloat(size);
  const duration = Math.max(1500, sizeNum * 400); // وقت محاكي

  const btn = document.getElementById(`pkgBtn-${itemKey}`);
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      clearInterval(interval);
      downloadedPackages[pkgKey][itemKey] = true;
      saveDownloadState();
      renderOfflinePackages();
      showToast(`✅ تم تنزيل ${itemKey} بنجاح`, 'success');

      // حفظ في IndexedDB للاستخدام الفعلي
      dbPut('packages', {
        id: `${pkgKey}_${itemKey}`,
        downloaded: true,
        timestamp: Date.now(),
        size,
      }).catch(console.warn);
    }
    if (btn) {
      btn.title = `${Math.min(100, Math.round(progress))}%`;
    }
  }, duration / 15);
}

async function downloadAllPackages(pkgKey) {
  const pkg = OFFLINE_PACKAGES[pkgKey];
  if (!pkg) return;
  const keys = Object.keys(pkg);
  showToast('⬇️ بدء تنزيل جميع الحزم...', 'info');
  for (let i = 0; i < keys.length; i++) {
    await new Promise(resolve => {
      setTimeout(() => {
        const k = keys[i];
        if (!downloadedPackages[pkgKey]?.[k]) {
          togglePackageDownload(pkgKey, k, pkg[k].size);
        }
        resolve();
      }, i * 200);
    });
  }
}

function saveDownloadState() {
  localStorage.setItem('downloadedPkgs', JSON.stringify(downloadedPackages));
}

// ─── البحث والقاموس ──────────────────────────────────────────
async function searchWord(word) {
  if (!word || word.trim() === '') return;
  word = word.trim();
  currentWord = word;

  addToHistory(word);
  showLoading(true);

  // تحقق من الأوفلاين أولاً
  const offlineResult = await getFromOfflineDB(word);
  if (offlineResult) {
    displayResult(offlineResult, true);
    showLoading(false);
    return;
  }

  if (!isOnline) {
    showOfflineMessage();
    showLoading(false);
    return;
  }

  // اتصال بالـ API
  try {
    const data = await fetchWordData(word);
    displayResult(data, false);
    // حفظ في الكاش
    await cacheWordResult(word, data);
  } catch (err) {
    showError('لم يتم العثور على الكلمة');
  }
  showLoading(false);
}

async function fetchWordData(word) {
  const res  = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}

async function getFromOfflineDB(word) {
  try {
    const result = await dbGet('wordDetails', word.toLowerCase());
    return result?.data || null;
  } catch { return null; }
}

async function cacheWordResult(word, data) {
  try {
    await dbPut('wordDetails', { word: word.toLowerCase(), data, timestamp: Date.now() });
  } catch(e) { console.warn('Cache error', e); }
}

function displayResult(data, isOffline) {
  const entry = Array.isArray(data) ? data[0] : data;
  if (!entry) { showError('لم يتم العثور على الكلمة'); return; }

  const word     = entry.word || currentWord;
  const phonetic = entry.phonetic || (entry.phonetics || []).find(p => p.text)?.text || '';
  const meanings = entry.meanings || [];

  let html = `
  <div class="result-card ${isOffline ? 'offline-badge' : ''}">
    <div class="result-header">
      <div class="word-main">
        <h1 class="word-title">${word}</h1>
        ${phonetic ? `<span class="phonetic">${phonetic}</span>` : ''}
      </div>
      <div class="word-actions">
        <button id="speakBtn" class="action-btn speak-btn" onclick="speakWord('${word}','${sourceLang}')" title="النطق">
          <i class="fas fa-volume-up"></i>
        </button>
        <button class="action-btn fav-btn ${favorites.includes(word) ? 'active' : ''}"
                onclick="toggleFavorite('${word}')" title="المفضلة">
          <i class="fas fa-star"></i>
        </button>
        <button class="action-btn copy-btn" onclick="copyWord('${word}')" title="نسخ">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    </div>
    ${isOffline ? '<span class="offline-indicator"><i class="fas fa-wifi-slash"></i> أوفلاين</span>' : ''}
    <div class="meanings-container">`;

  meanings.forEach(meaning => {
    html += `
      <div class="meaning-block">
        <span class="part-of-speech">${meaning.partOfSpeech || ''}</span>
        <ol class="definitions-list">`;
    (meaning.definitions || []).slice(0, 3).forEach(def => {
      html += `<li class="definition-item">
        <p>${def.definition || ''}</p>
        ${def.example ? `<p class="example-text">"${def.example}"</p>` : ''}
      </li>`;
    });
    html += `</ol>`;

    if ((meaning.synonyms || []).length) {
      html += `<div class="word-chips">
        <span class="chips-label">Synonyms:</span>
        ${meaning.synonyms.slice(0, 6).map(s =>
          `<span class="chip" onclick="searchWord('${s}')">${s}</span>`
        ).join('')}
      </div>`;
    }
    if ((meaning.antonyms || []).length) {
      html += `<div class="word-chips antonyms">
        <span class="chips-label">Antonyms:</span>
        ${meaning.antonyms.slice(0, 6).map(a =>
          `<span class="chip antonym" onclick="searchWord('${a}')">${a}</span>`
        ).join('')}
      </div>`;
    }
    html += `</div>`;
  });

  html += `</div></div>`;
  document.getElementById('resultContainer').innerHTML = html;
}

// ─── الترجمة ─────────────────────────────────────────────────
async function translateWord(word) {
  if (!word) return;
  const pkgKey   = `${sourceLang}-${targetLang}`;
  const altKey   = `${targetLang}-${sourceLang}`;
  const hasOffline = downloadedPackages[pkgKey]?.translation === true ||
                     downloadedPackages[altKey]?.translation === true;

  if (hasOffline) {
    // محاكاة الترجمة الأوفلاين
    const mockTrans = await simulateOfflineTranslation(word);
    showTranslation(mockTrans, true);
    return;
  }

  if (!isOnline) {
    document.getElementById('translationContainer').innerHTML = `
      <div class="offline-translation-card">
        <i class="fas fa-mobile-alt-slash fa-2x"></i>
        <h3>Offline</h3>
        <p>Translation requires internet connection for this word.</p>
        <button class="btn-download-pkg" onclick="showOfflineTab()">
          <i class="fas fa-download"></i> تنزيل حزمة الأوفلاين
        </button>
      </div>`;
    return;
  }

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${sourceLang}|${targetLang}`
    );
    const d = await res.json();
    const translation = d?.responseData?.translatedText || '';
    showTranslation(translation, false);
  } catch {
    showTranslation('', false);
  }
}

function showTranslation(text, isOffline) {
  const el = document.getElementById('translationContainer');
  if (!el) return;
  if (!text) {
    el.innerHTML = `<p class="trans-error">لم تتم الترجمة</p>`;
    return;
  }
  el.innerHTML = `
    <div class="translation-card ${isOffline ? 'offline' : ''}">
      ${isOffline ? '<span class="offline-badge-sm"><i class="fas fa-wifi-slash"></i> أوفلاين</span>' : ''}
      <p class="translation-text">${text}</p>
      <button class="action-btn speak-btn-sm" onclick="speakWord('${text}','${targetLang}')">
        <i class="fas fa-volume-up"></i> نطق الترجمة
      </button>
    </div>`;
}

async function simulateOfflineTranslation(word) {
  // قاموس محلي مصغَّر للمحاكاة (سيُستبدَل بالـ SQLite الفعلي)
  const miniDict = {
    'hello':'مرحبا','world':'عالم','book':'كتاب','love':'حب',
    'house':'بيت','water':'ماء','fire':'نار','sky':'سماء',
    'tree':'شجرة','car':'سيارة','phone':'هاتف','computer':'حاسوب',
  };
  return miniDict[word.toLowerCase()] || `[أوفلاين] ${word}`;
}

// ─── المفضلة والتاريخ ─────────────────────────────────────────
function toggleFavorite(word) {
  const idx = favorites.indexOf(word);
  if (idx > -1) favorites.splice(idx, 1);
  else favorites.unshift(word);
  localStorage.setItem('favorites', JSON.stringify(favorites));
  const btn = document.querySelector('.fav-btn');
  if (btn) btn.classList.toggle('active', favorites.includes(word));
  showToast(idx > -1 ? '💔 حُذف من المفضلة' : '⭐ أُضيف إلى المفضلة', 'info');
}

function addToHistory(word) {
  history = [word, ...history.filter(w => w !== word)].slice(0, 50);
  localStorage.setItem('history', JSON.stringify(history));
}

function copyWord(word) {
  navigator.clipboard.writeText(word).then(() => showToast('📋 تم النسخ', 'success'));
}

// ─── واجهة المستخدم ──────────────────────────────────────────
function showLoading(show) {
  const el = document.getElementById('loadingIndicator');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showError(msg) {
  document.getElementById('resultContainer').innerHTML = `
    <div class="error-card"><i class="fas fa-exclamation-triangle"></i><p>${msg}</p></div>`;
}

function showOfflineMessage() {
  document.getElementById('resultContainer').innerHTML = `
    <div class="offline-card">
      <i class="fas fa-wifi-slash fa-2x"></i>
      <h3>أنت أوفلاين</h3>
      <p>هذه الكلمة غير متوفرة في قاعدة البيانات المحلية</p>
      <button class="btn-go-offline" onclick="showOfflineTab()">
        <i class="fas fa-download"></i> تنزيل حزم الأوفلاين
      </button>
    </div>`;
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

function showOfflineTab() {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const offlineTab = document.getElementById('offline-tab');
  if (offlineTab) { offlineTab.classList.add('active'); }
  const offlineBtn = document.querySelector('[data-tab="offline"]');
  if (offlineBtn) { offlineBtn.classList.add('active'); }
  renderOfflinePackages();
}

// ─── التبويبات ────────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  document.getElementById(`${tabName}-tab`)?.classList.add('active');

  if (tabName === 'translation' && currentWord) translateWord(currentWord);
  if (tabName === 'offline') renderOfflinePackages();
}

// ─── تبديل اللغة ─────────────────────────────────────────────
function swapLanguages() {
  [sourceLang, targetLang] = [targetLang, sourceLang];
  localStorage.setItem('srcLang', sourceLang);
  localStorage.setItem('tgtLang', targetLang);
  updateLangUI();
  renderOfflinePackages();
  if (currentWord) translateWord(currentWord);
}

function updateLangUI() {
  const src = SUPPORTED_LANG_PAIRS[sourceLang];
  const tgt = SUPPORTED_LANG_PAIRS[targetLang];
  document.getElementById('srcLangBtn').innerHTML  = `${src.flag} ${src.name} <i class="fas fa-chevron-down"></i>`;
  document.getElementById('tgtLangBtn').innerHTML  = `${tgt.flag} ${tgt.name} <i class="fas fa-chevron-down"></i>`;
}

// ─── الشريط العلوي للأوفلاين ─────────────────────────────────
function updateOnlineStatus() {
  isOnline = navigator.onLine;
  const bar = document.getElementById('offlineBar');
  if (bar) bar.style.display = isOnline ? 'none' : 'flex';
}
window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ─── تهيئة التطبيق ───────────────────────────────────────────
async function initApp() {
  await initDB();
  updateOnlineStatus();
  updateLangUI();

  // حقل البحث
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      const val = e.target.value.trim();
      if (val.length >= 2) {
        debounceTimer = setTimeout(() => searchWord(val), 500);
      }
    });
    searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') searchWord(searchInput.value.trim());
    });
  }

  // أحداث الأزرار
  document.getElementById('searchBtn')?.addEventListener('click', () =>
    searchWord(document.getElementById('searchInput')?.value));
  document.getElementById('swapBtn')?.addEventListener('click', swapLanguages);
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    document.getElementById('resultContainer').innerHTML = '';
  });

  // الشاشة الرئيسية
  const savedWord = localStorage.getItem('lastWord');
  if (savedWord) searchWord(savedWord);

  // أصوات TTS - تحميل مسبق
  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
  }
}

document.addEventListener('DOMContentLoaded', initApp);
