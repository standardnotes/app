module.exports = {
  dependencies: {
    'react-native-iap': {
      platforms: {
        // IAP is iOS-only (Apple StoreKit). Excluding Android avoids bundling
        // Google Play Billing Library, which triggers Play Console policy checks.
        android: null,
      },
    },
  },
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
}
