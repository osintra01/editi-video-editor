# Editi

Editi is an original, free-to-use video editor prototype for web, Android, and Windows. It is not affiliated with or a copy of CapCut. This MVP runs locally in the browser, includes a responsive editing workspace, media import, clip selection, trim controls, text overlay, and WebM export without a watermark.

## Requirements
- Node.js 20+
- npm

## Run the web app
```bash
npm install
npm run dev
```

## Build the web app
```bash
npm run build
npm run preview
```

## Android APK (Capacitor)
Install Android Studio and its Android SDK, then:
```bash
npm run android:add
npm run android:sync
npm run android:open
```
Build a debug APK in Android Studio (Build > Build Bundle(s) / APK(s) > Build APK(s)). This repository contains the app source and build configuration; it does not include precompiled APK binaries.

## Windows EXE (Electron)
On Windows, install Node.js 20+ and run:
```bash
npm install
npm run desktop:dist
```
The installer is generated under `release/`. For a Windows installer, build on Windows. Electron packaging may require platform-specific build tools.

## Current MVP capabilities
- Import local video, audio, and image files
- Select a video clip and preview it
- Set an in/out trim range and preview the selection
- Add an editable title overlay
- Export the selected video segment to WebM without a watermark
- Responsive layout suitable for desktop and mobile screens

## Notes
The app processes media locally in the browser. Export support depends on browser MediaRecorder codecs; WebM is used where available. This is a starting point, not a feature-complete replacement for commercial editors. Advanced AI features, a licensed stock-media library, and all CapCut features are not included. Imported media is not uploaded.

## License
MIT. See [LICENSE](LICENSE).