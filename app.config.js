/**
 * Two store apps from this one codebase (Expo "app variants"):
 *
 *   APP_VARIANT=customer (default) → "Loomodex"          com.loomodex.app      customers, sellers, customer service
 *   APP_VARIANT=drivers            → "Loomodex Drivers"  com.loomodex.drivers  drivers, logistics managers, partner managers
 *
 * app.json holds the customer app's config; this file only overrides what differs for the
 * Drivers app. The variant is also exposed at runtime as `extra.appVariant` (src/appVariant.ts).
 *
 * Builds:   eas build -p android --profile preview            (Loomodex)
 *           eas build -p android --profile drivers-preview    (Loomodex Drivers)
 */
const fs = require('fs');
const path = require('path');

/** EAS project of Loomodex Drivers (owner fhdlkhn). Paste the id printed by `eas init`. */
const DRIVERS_EAS_PROJECT_ID = process.env.DRIVERS_EAS_PROJECT_ID || '3d1ca04e-8652-422f-a1d3-a37131c1e22e';

const exists = (p) => fs.existsSync(path.join(__dirname, p));
/** Use the Drivers-specific asset when it exists, else the shared one. */
const asset = (driversFile, fallback) => (exists(driversFile) ? driversFile : fallback);

module.exports = ({ config }) => {
  const variant = process.env.APP_VARIANT === 'drivers' ? 'drivers' : 'customer';
  if (variant === 'customer') {
    return { ...config, extra: { ...config.extra, appVariant: 'customer' } };
  }

  const plugins = (config.plugins || []).map((p) => {
    const name = Array.isArray(p) ? p[0] : p;
    if (name === 'expo-location') {
      return ['expo-location', {
        locationWhenInUsePermission:
          "Loomodex Drivers utilise votre position pendant les livraisons : navigation vers le magasin et le client, et suivi en direct par l'équipe logistique et le client.",
      }];
    }
    if (name === 'expo-image-picker') {
      return ['expo-image-picker', {
        photosPermission: 'Loomodex Drivers accède à vos photos pour votre photo de profil.',
        cameraPermission: "Loomodex Drivers utilise l'appareil photo pour votre photo de profil.",
        microphonePermission: false,
      }];
    }
    if (name === 'expo-splash-screen') {
      return ['expo-splash-screen', { ...(Array.isArray(p) ? p[1] : {}), image: asset('./assets/drivers/splash-icon.png', './assets/splash-icon.png') }];
    }
    return p;
  });

  const androidGoogle = asset('./google-services.drivers.json', null);
  const iosGoogle = asset('./GoogleService-Info.drivers.plist', null);

  return {
    ...config,
    name: 'Loomodex Drivers',
    slug: 'loomodex-drivers',
    scheme: 'loomodexdrivers',
    icon: asset('./assets/drivers/icon.png', config.icon),
    ios: {
      ...config.ios,
      bundleIdentifier: 'com.loomodex.drivers',
      icon: asset('./assets/drivers/ios-icon.png', config.ios.icon),
      ...(iosGoogle ? { googleServicesFile: iosGoogle } : { googleServicesFile: undefined }),
    },
    android: {
      ...config.android,
      package: 'com.loomodex.drivers',
      adaptiveIcon: {
        ...config.android.adaptiveIcon,
        foregroundImage: asset('./assets/drivers/android-icon-foreground.png', config.android.adaptiveIcon.foregroundImage),
      },
      ...(androidGoogle ? { googleServicesFile: androidGoogle } : { googleServicesFile: undefined }),
    },
    plugins,
    extra: {
      ...config.extra,
      appVariant: 'drivers',
      eas: DRIVERS_EAS_PROJECT_ID ? { projectId: DRIVERS_EAS_PROJECT_ID } : {},
    },
  };
};
