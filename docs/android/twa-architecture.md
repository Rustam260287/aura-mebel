# Android TWA Architecture (Aura AR Shell)

> [!IMPORTANT]
> **Philosophy: Quiet UX / Vanishing App**
> This is **NOT** a standard Android app. It is a thin "AR Shell" designed solely to bypass browser restrictions (e.g., Yandex Browser's lack of WebXR) and provide a stable Chrome-based environment for AR.
>
> The user should feel like they are simply "opening the camera," not "launching an app."

## 1. Core Concept

-   **Type**: Trusted Web Activity (TWA) via Android Custom Tabs.
-   **No WebView**: Uses the user's installed Chrome (or compatible provider) engine directly.
-   **No Custom UI**: No splash screen (if possible), no navigation bars, no "Chrome" UI chrome.
-   **Single Purpose**: Open `https://aura-room.ru/ar` and vanish when done.

## 2. Manifest Configuration (`AndroidManifest.xml`)

Ideally, the APK is < 2MB.

### Key Attributes
-   **`launchMode="singleTask"`**: Critical. If the user switches back to the browser and clicks "View in AR" again, it should utilize the existing Activity rather than stacking new ones.
-   **Permissions**: STRICTLY MINIMAL.
    -   `android.permission.CAMERA` (Required for WebXR).
    -   *No Location, No Storage, No Notifications.*
-   **Theme**: `Theme.NoDisplay` (Ideal) or `Theme.Translucent.NoTitleBar` (Fallback).

### Example Manifest Snippet

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.aura.shell">

    <!-- AR is the only reason this app exists -->
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="Aura"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".LauncherActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/Theme.Launcher">
            
            <!-- Handle standard launch -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Handle Deep Link (Intent from Web) -->
            <!-- Scheme: https allows it to handle standard URLs if set as default -->
            <!-- Scheme: intent allows explicit targeting from Yandex/Other browsers -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                
                <data android:scheme="https" android:host="aura-room.ru" android:pathPrefix="/ar" />
                <data android:scheme="intent" android:host="aura-room.ru" />
            </intent-filter>
        </activity>
        
        <!-- TWA Service Definition -->
        <!-- ... Standard androidx.browser.trusted constraints ... -->
        
    </application>
</manifest>
```

### Theme Strategy for "Quiet UX"
Due to Android OEM differences, `Theme.NoDisplay` can sometimes cause a black screen if the Chrome TWA doesn't handshake instantly.

**Recommended Style (`res/values/styles.xml`):**
```xml
<style name="Theme.Launcher" parent="Theme.AppCompat.NoActionBar">
    <item name="android:windowBackground">@android:color/transparent</item>
    <item name="android:colorBackgroundCacheHint">@null</item>
    <item name="android:windowIsTranslucent">true</item>
    <item name="android:windowAnimationStyle">@null</item>
</style>
```

## 3. Digital Asset Links (`assetlinks.json`)

To remove the Chrome URL bar and verify ownership, the relation must be established securely.

**Location**: `https://aura-room.ru/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.aura.shell",
      "sha256_cert_fingerprints": [
        "YOUR_RELEASE_KEY_SHA256_FINGERPRINT",
        "YOUR_DEBUG_KEY_SHA256_FINGERPRINT"
      ]
    }
  }
]
```

## 4. Web Integration Flow

### Challenge
Yandex Browser and other WebViews do not support WebXR. We need to "break out" to the TWA (which runs in Chrome context).

### The "Intent" Trigger
On the web (in `ArBrowserGuard` or similar):

```typescript
const openAndroidARShell = (modelId: string) => {
  // Construct the Intent URL
  // package=com.aura.shell ensures we try to open OUR app, preventing browser ambiguity
  // S.browser_fallback_url ensures if app is not installed (or fails), we land on proper web page
  
  const fallbackUrl = encodeURIComponent(`https://aura-room.ru/ar?model=${modelId}&fallback=true`);
  const originalUrl = `https://aura-room.ru/ar?model=${modelId}`;
  const scheme = originalUrl.replace('https://', '');
  
  // Syntax: intent://<HOST_AND_PATH>#Intent;scheme=https;package=<PKG>;S.browser_fallback_url=<URL>;end
  
  const intent = 
    `intent://${scheme}#Intent;` +
    `scheme=https;` +
    `package=com.aura.shell;` +
    `S.browser_fallback_url=${fallbackUrl};` +
    `end`;
    
  window.location.href = intent;
};
```

### User Experience
1.  **User in Yandex Browser**: Clicks "View in Interior".
2.  **Detection**: Script sees `Yandex` UA + `Android`.
3.  **Action**: Triggers `intent://` URL.
4.  **System**:
    -   **If App Installed**: Instantly launches `com.aura.shell`. TWA opens. Camera starts.
    -   **If App Missing**: System redirects to `S.browser_fallback_url` (Play Store logic can be injected here later).

## 5. Deployment Checklist
- [ ] Generate Keystore (Release).
- [ ] Extract SHA-256 Fingerprint.
- [ ] Update `.well-known/assetlinks.json` on VERCEL/Production.
- [ ] Build Signed APK/AAB.
- [ ] Upload to generic hosting or internal distribution for testing (Play Store verification takes longer).
