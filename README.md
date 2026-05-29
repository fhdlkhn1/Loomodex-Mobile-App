# Loomodex — Mobile App

Cross-platform (Android + iOS) React Native app built with Expo, ported from the Loomodex
web prototype. Loomodex is a marketplace for Guinea — GNF pricing, Mobile Money payments,
cash-on-delivery with OTP handoff, live tracking, and seller/driver/logistics dashboards.

## Stack

- **Expo SDK 56** / React Native 0.85 / React 19 (TypeScript)
- **React Navigation** — native-stack + custom bottom tab bar (Accueil · Compte · Panier · Menu · Chat)
- **react-native-svg** — all icons, charts, and the faux map are vector-drawn
- **expo-linear-gradient** — banners, wallet/earnings cards, avatars
- Fonts: **Geist**, **Geist Mono**, **Instrument Serif** (via `@expo-google-fonts`)
- Product imagery loads from Unsplash at runtime

## Project structure

```
App.tsx                 # Root: font loading, navigation container, splash
src/theme.ts            # Design tokens, fonts, currency helpers
src/data.ts             # Catalog + categories + image resolver
src/Icon.tsx            # SVG icon set + category glyphs
src/components.tsx      # Shared UI (Screen, AppBar, Button, ProductCard, …)
src/navigation.tsx      # Root stack + tab navigator
src/screens/*           # All 40 screens, grouped by section
```

### Screens (40)

Onboarding · Sign up · OTP · Sign in · Forgot · Reset · Home · Categories · Category browse ·
Search · Search results · Filter sheet · Product detail · Seller storefront · Cart · Checkout ·
Order placed · Live tracking · Track by number · My orders · Order details · Return request ·
Write review · Saved · Liste de souhaits (+ empty) · Account · Notifications · Account details ·
Addresses · Add/edit address · Wallet · Payment methods · Help center · Support tickets ·
Inquiries · Seller dashboard · Add product · Driver dashboard · Logistics ops.

## Run in development

```bash
npm install
npm run android   # or: npm run ios   /   npm start  (Expo Go / dev client)
```

## Build an installable Android APK (local)

Requires Android SDK (platform 36, build-tools 36, NDK r27b) and JDK 17.

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
npx expo prebuild --platform android
cd android && ./gradlew :app:assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

The release APK is signed with the Android debug keystore, so it installs directly on any
device (`adb install app-release.apk` or copy + open). For Play Store distribution, generate a
release keystore and wire it into `android/app/build.gradle`.

## Build for iOS

iOS requires a Mac with **full Xcode** (Command Line Tools alone are not enough):

```bash
npx expo prebuild --platform ios
cd ios && pod install
# open ios/Loomodex.xcworkspace in Xcode, select a team, Run / Archive
```

## Cloud builds (EAS) — both platforms

```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview   # installable APK
eas build -p ios --profile preview        # installable iOS build (no local Mac needed)
```

## App identity

- Name: **Loomodex**
- Bundle ID / package: `com.loomodex.app`
- Icon: `assets/icon.png` (replace with final brand icon, then re-run prebuild/build)
