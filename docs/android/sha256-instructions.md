# How to get SHA-256 Fingerprint

To complete the Digital Asset Links binding, run this command in your terminal (requires Java/JDK):

### For Release Key:
```bash
keytool -list -v -keystore path/to/your-release-key.jks -alias your-key-alias
```

### For Debug Key (Default):
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Copy the **SHA-256** fingerprint (e.g., `14:6D:E9:...`) and paste it into `public/.well-known/assetlinks.json`.
