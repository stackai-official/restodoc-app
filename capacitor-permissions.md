# Capacitor Permissions Setup

Run these after `npx cap add android` and `npx cap add ios`:

## Android — android/app/src/main/AndroidManifest.xml

Add inside `<manifest>` (before `<application>`):

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

## iOS — ios/App/App/Info.plist

Add inside `<dict>`:

```xml
<key>NSCameraUsageDescription</key>
<string>RestoDoc needs camera access to photograph restoration job sites.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>RestoDoc needs photo library access to save and attach job site photos.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>RestoDoc needs to save photos to your library.</string>
<key>NSMicrophoneUsageDescription</key>
<string>RestoDoc needs microphone access to record video at job sites.</string>
```
