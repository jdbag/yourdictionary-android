# Your Dictionary - Android App
## تطبيق قاموسك للأندرويد

---

## 📋 معلومات المشروع
- **اسم التطبيق:** Your Dictionary
- **Package:** com.yourdictionary.app
- **App ID (AdMob):** ca-app-pub-3640039090708511~5919732665

## 💰 وحدات الإعلانات المضافة
| النوع | ID |
|---|---|
| Banner (رئيسي) | ca-app-pub-3640039090708511/9276320484 |
| Interstitial 1 | ca-app-pub-3640039090708511/6729312104 |
| Interstitial 2 | ca-app-pub-3640039090708511/1262302352 |
| Banner 2 | ca-app-pub-3640039090708511/1089972619 |
| Banner 3 | ca-app-pub-3640039090708511/9324625209 |
| Rewarded | ca-app-pub-3640039090708511/3713205876 |

---

## 🔨 خطوات بناء الـ APK

### المتطلبات:
1. **Android Studio** (تحميل من: https://developer.android.com/studio)
2. **JDK 17** أو أحدث

### خطوات البناء:

#### الطريقة الأولى - Android Studio (الأسهل):
1. افتح Android Studio
2. اختر `File → Open` وافتح مجلد `YourDictionary`
3. انتظر حتى يكتمل تحميل Gradle
4. اضغط `Build → Build Bundle(s)/APK(s) → Build APK(s)`
5. ستجد الـ APK في: `app/build/outputs/apk/debug/app-debug.apk`

#### الطريقة الثانية - Command Line:
```bash
cd YourDictionary
./gradlew assembleDebug
```
الـ APK في: `app/build/outputs/apk/debug/app-debug.apk`

### لبناء APK للنشر (Release):
```bash
./gradlew assembleRelease
```
ثم وقّع الـ APK من Android Studio: `Build → Generate Signed Bundle/APK`

---

## 📱 هيكل المشروع
```
YourDictionary/
├── app/
│   ├── src/main/
│   │   ├── assets/www/        ← ملفات الويب (HTML/CSS/JS)
│   │   │   ├── index.html
│   │   │   ├── style.css
│   │   │   ├── app.js
│   │   │   └── admob.js
│   │   ├── java/.../MainActivity.java  ← كود أندرويد + AdMob
│   │   ├── res/layout/activity_main.xml
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
├── settings.gradle
└── gradle.properties
```

---

## ✅ ميزات التطبيق
- ✔ قاموس إنجليزي كامل (API مجاني)
- ✔ بحث فوري عن الكلمات
- ✔ كلمة اليوم
- ✔ المفضلة
- ✔ الترجمة
- ✔ اختبار (Quiz)
- ✔ إعلانات Banner في الأسفل
- ✔ إعلانات Interstitial بعد كل 3 بحثات
- ✔ يعمل بدون إنترنت (الواجهة فقط)
