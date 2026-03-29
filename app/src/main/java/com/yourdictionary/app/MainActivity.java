package com.yourdictionary.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.JavascriptInterface;
import android.widget.LinearLayout;
import android.view.Gravity;
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

    private static final String BANNER_AD_UNIT   = "ca-app-pub-3640039090708511/9276320484";
    private static final String INTER_AD_UNIT    = "ca-app-pub-3640039090708511/6729312104";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Build layout programmatically - no XML needed for ad
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);

        // WebView
        webView = new WebView(this);
        LinearLayout.LayoutParams wvParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f);
        webView.setLayoutParams(wvParams);

        // Banner Ad
        bannerAdView = new AdView(this);
        bannerAdView.setAdUnitId(BANNER_AD_UNIT);
        bannerAdView.setAdSize(AdSize.BANNER);
        LinearLayout.LayoutParams adParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT);
        adParams.gravity = Gravity.CENTER_HORIZONTAL;
        bannerAdView.setLayoutParams(adParams);

        root.addView(webView);
        root.addView(bannerAdView);
        setContentView(root);

        // Init Ads
        MobileAds.initialize(this, status -> {});
        bannerAdView.loadAd(new AdRequest.Builder().build());
        loadInterstitial();

        // WebView settings
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        webView.addJavascriptInterface(new Bridge(), "AndroidBridge");
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    private void loadInterstitial() {
        InterstitialAd.load(this, INTER_AD_UNIT,
            new AdRequest.Builder().build(),
            new InterstitialAdLoadCallback() {
                @Override public void onAdLoaded(InterstitialAd ad) {
                    interstitialAd = ad;
                }
                @Override public void onAdFailedToLoad(LoadAdError e) {
                    interstitialAd = null;
                }
            });
    }

    public class Bridge {
        @JavascriptInterface
        public void showInterstitial() {
            runOnUiThread(() -> {
                if (interstitialAd != null) {
                    interstitialAd.show(MainActivity.this);
                    interstitialAd = null;
                    loadInterstitial();
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onPause()   { super.onPause();   if(bannerAdView!=null) bannerAdView.pause(); }
    @Override protected void onResume()  { super.onResume();  if(bannerAdView!=null) bannerAdView.resume(); }
    @Override protected void onDestroy() { super.onDestroy(); if(bannerAdView!=null) bannerAdView.destroy(); }
}
