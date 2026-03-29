package com.yourdictionary.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.RelativeLayout;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.LoadAdError;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private AdView bannerAdView;
    private InterstitialAd interstitialAd;

    // Ad Unit IDs
    private static final String BANNER_AD_UNIT_ID = "ca-app-pub-3640039090708511/9276320484";
    private static final String INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-3640039090708511/6729312104";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize Mobile Ads
        MobileAds.initialize(this, initializationStatus -> {});

        // Setup WebView
        webView = findViewById(R.id.webView);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        // Add JavaScript bridge for ads
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient());

        // Load the app
        webView.loadUrl("file:///android_asset/www/index.html");

        // Setup banner ad
        setupBannerAd();

        // Load interstitial ad
        loadInterstitialAd();
    }

    private void setupBannerAd() {
        bannerAdView = findViewById(R.id.adView);
        AdRequest adRequest = new AdRequest.Builder().build();
        bannerAdView.loadAd(adRequest);
    }

    private void loadInterstitialAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        InterstitialAd.load(this, INTERSTITIAL_AD_UNIT_ID, adRequest,
            new InterstitialAdLoadCallback() {
                @Override
                public void onAdLoaded(InterstitialAd ad) {
                    interstitialAd = ad;
                }
                @Override
                public void onAdFailedToLoad(LoadAdError adError) {
                    interstitialAd = null;
                }
            });
    }

    public class AndroidBridge {
        @JavascriptInterface
        public void showBanner(String adUnitId, String containerId) {
            // Banner is shown natively
        }

        @JavascriptInterface
        public void loadInterstitial(String adUnitId) {
            runOnUiThread(() -> loadInterstitialAd());
        }

        @JavascriptInterface
        public void showInterstitial(String adUnitId) {
            runOnUiThread(() -> {
                if (interstitialAd != null) {
                    interstitialAd.show(MainActivity.this);
                    interstitialAd = null;
                    loadInterstitialAd(); // reload for next time
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        if (bannerAdView != null) bannerAdView.pause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (bannerAdView != null) bannerAdView.resume();
    }

    @Override
    protected void onDestroy() {
        if (bannerAdView != null) bannerAdView.destroy();
        super.onDestroy();
    }
}
