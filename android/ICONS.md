# Android App Icons

Dieses Projekt verwendet die bestehenden PWA-Icons für die Android-App.

## Verwendete Icons

| Android DPI | PWA Icon | Größe |
|-------------|----------|-------|
| mdpi | icon-48x48.png | 48x48 |
| hdpi | icon-72x72.png | 72x72 |
| xhdpi | icon-96x96.png | 96x96 |
| xxhdpi | icon-144x144.png | 144x144 |
| xxxhdpi | icon-192x192.png | 192x192 |
| Adaptive | icon-512x512.png | 512x512 |

## Icons Setup

Nach `npx cap add android` ausführen:

```bash
chmod +x setup-android-icons.sh
./setup-android-icons.sh
```

Oder manuell kopieren:

```bash
# Launcher Icons
cp public/icon-48x48.png android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp public/icon-72x72.png android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp public/icon-96x96.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp public/icon-144x144.png android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp public/icon-192x192.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

## Dann Build

```bash
npm run cap:build:debug
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
