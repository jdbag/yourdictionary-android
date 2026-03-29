// AdMob Integration via Android WebView Bridge
// Ad Unit IDs
const AD_UNITS = {
  banner1: 'ca-app-pub-3640039090708511/9276320484',
  banner2: 'ca-app-pub-3640039090708511/1089972619',
  banner3: 'ca-app-pub-3640039090708511/9324625209',
  interstitial1: 'ca-app-pub-3640039090708511/6729312104',
  interstitial2: 'ca-app-pub-3640039090708511/1262302352',
  rewarded: 'ca-app-pub-3640039090708511/3713205876'
};

// Call Android bridge to show ads
function initAds() {
  if (window.AndroidBridge) {
    // Show banner ads
    window.AndroidBridge.showBanner(AD_UNITS.banner1, 'adBannerTop');
    window.AndroidBridge.loadInterstitial(AD_UNITS.interstitial1);
  }
}

// Show interstitial after 3 searches
let searchCount = 0;
function onSearch() {
  searchCount++;
  if (searchCount % 3 === 0 && window.AndroidBridge) {
    window.AndroidBridge.showInterstitial(AD_UNITS.interstitial1);
  }
}

// Show interstitial on page change
function onPageChange() {
  if (window.AndroidBridge) {
    window.AndroidBridge.showInterstitial(AD_UNITS.interstitial2);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  initAds();

  // Hook into search button
  const heroBtn = document.getElementById('heroBtn');
  if (heroBtn) {
    heroBtn.addEventListener('click', onSearch);
  }

  // Hook into nav links for interstitial
  document.querySelectorAll('.nav-link, .mobile-nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      if (!link.classList.contains('active')) {
        onPageChange();
      }
    });
  });
});
