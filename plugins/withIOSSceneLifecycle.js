/**
 * iOS 27 terminates apps that have not adopted the UIScene lifecycle
 * (UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption). The Expo SDK 55 template
 * still creates its window in application(_:didFinishLaunchingWithOptions:), so this plugin:
 *
 *  1. declares a UIApplicationSceneManifest in Info.plist pointing at SceneDelegate;
 *  2. makes AppDelegate build the React Native factory only, and stash the launch options;
 *  3. adds a SceneDelegate that creates the window and starts React Native in it, and forwards
 *     URL opens, universal links and foreground/background events back to ExpoAppDelegate
 *     (UIKit no longer calls those on the app delegate once scenes are adopted);
 *  4. raises pod targets below iOS 15.1, which Xcode 27 refuses to build.
 */
const fs = require('fs');
const path = require('path');
const { withInfoPlist, withAppDelegate, withDangerousMod } = require('expo/config-plugins');

const MARKER = '// [withIOSSceneLifecycle]';

const SCENE_DELEGATE = `
${MARKER}
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var appDelegate: AppDelegate? { UIApplication.shared.delegate as? AppDelegate }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = appDelegate,
          let factory = appDelegate.reactNativeFactory else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    // Cold-start deep links arrive on the scene, not in launchOptions; put them back so
    // Linking.getInitialURL() keeps working.
    var launchOptions = appDelegate.launchOptions ?? [:]
    if let url = connectionOptions.urlContexts.first?.url {
      launchOptions[.url] = url
    }
    if let activity = connectionOptions.userActivities.first {
      launchOptions[.userActivityDictionary] = [
        UIApplication.LaunchOptionsKey.userActivityType.rawValue: activity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": activity,
      ] as [String: Any]
    }

    factory.startReactNative(withModuleName: "main", in: window, launchOptions: launchOptions)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let appDelegate = appDelegate else { return }
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
      if let source = context.options.sourceApplication { options[.sourceApplication] = source }
      if let annotation = context.options.annotation { options[.annotation] = annotation }
      _ = appDelegate.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }
}
`;

function patchAppDelegate(src) {
  if (src.includes(MARKER)) return src;

  const windowBlock =
    /#if os\(iOS\) \|\| os\(tvOS\)\s*\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\s*\n\s*factory\.startReactNative\([\s\S]*?\)\s*\n#endif/;
  if (!windowBlock.test(src)) {
    throw new Error('[withIOSSceneLifecycle] AppDelegate.swift no longer matches the expected Expo template; update the plugin.');
  }
  src = src.replace(windowBlock, '    // The window is created by SceneDelegate (UIScene lifecycle).\n    self.launchOptions = launchOptions');

  const factoryVar = 'var reactNativeFactory: RCTReactNativeFactory?';
  if (!src.includes(factoryVar)) {
    throw new Error('[withIOSSceneLifecycle] reactNativeFactory property not found in AppDelegate.swift.');
  }
  src = src.replace(factoryVar, `${factoryVar}\n  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?`);

  return src + SCENE_DELEGATE;
}

const PODFILE_HOOK = `
    # [withIOSSceneLifecycle] Xcode 27 rejects pod targets below iOS 15.0
    installer.pods_project.targets.each do |t|
      t.build_configurations.each do |c|
        if c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.1
          c.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        end
      end
    end`;

function patchPodfile(src) {
  if (src.includes('[withIOSSceneLifecycle]')) return src;
  const anchor = /(react_native_post_install\([\s\S]*?\n\s*\))/;
  if (!anchor.test(src)) {
    throw new Error('[withIOSSceneLifecycle] react_native_post_install not found in Podfile.');
  }
  return src.replace(anchor, `$1\n${PODFILE_HOOK}`);
}

module.exports = function withIOSSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  config = withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('[withIOSSceneLifecycle] expected a Swift AppDelegate.');
    }
    cfg.modResults.contents = patchAppDelegate(cfg.modResults.contents);
    return cfg;
  });

  config = withDangerousMod(config, [
    'ios',
    (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      fs.writeFileSync(podfile, patchPodfile(fs.readFileSync(podfile, 'utf8')));
      return cfg;
    },
  ]);

  return config;
};
