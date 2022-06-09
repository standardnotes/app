# Standard Notes

<div align="center">

[![Latest release version](https://img.shields.io/github/v/release/standardnotes/mobile)](https://github.com/standardnotes/mobile/releases)
[![License](https://img.shields.io/github/license/standardnotes/mobile?color=blue)](https://github.com/standardnotes/mobile/blob/master/LICENSE)
[![Slack](https://img.shields.io/badge/slack-standardnotes-CC2B5E.svg?style=flat&logo=slack)](https://standardnotes.com/slack)
[![Twitter Follow](https://img.shields.io/badge/follow-%40standardnotes-blue.svg?style=flat&logo=twitter)](https://twitter.com/standardnotes)

</div>

## iOS & Android App

[Standard Notes](https://standardnotes.com) is a safe place for your notes, thoughts, and life's work. It focuses on being simple, so you don't have to fight with endless features that slow you down. It encrypts your notes to protect your privacy. And, it's extensible, so you can backup your notes to Dropbox, Google Drive, and other services, as well as install themes, editors, and more.

### Download Options:

- [iOS App Store](https://itunes.apple.com/us/app/standard-notes/id1285392450?mt=8) (iOS 10+)
- [Google Play](https://play.google.com/store/apps/details?id=com.standardnotes) (Android 5.0+)
- [Direct APK](https://github.com/standardnotes/mobile/releases)

## The Code

This is a React Native implementation of Standard Notes. React Native allows us to build native mobile applications using JavaScript. This allows us to develop faster, as well as have a more reliable and consistent cross-platform experience.

### Building from source

1. Setup your environment according to [official docs](https://reactnative.dev/docs/environment-setup) and be sure you can run an example React Native project.
2. If you would like to build the Android app, you'll need to install the Android NDK. We use native code from the Libsodium encryption library to achieve high performance. You can install the NDK inside of Android Studio. You'll need to pick the version listed [here](https://github.com/standardnotes/react-native-sodium/blob/master/android/build.gradle#L47).
3. Install [yarn](https://yarnpkg.com/) if you haven't already.
4. Install project dependencies via:

```shell
yarn run init
```

We have two flavors of the app:

- `dev` which runs connects to development syncing server. To run locally use `yarn ios-dev` or `yarn android-dev` for Android.
- `prod` which is the equivalent of our production application. To run local use `yarn ios-prod` or `yarn android-prod` for Android.

If you would like to run the application on your iOS device, you'll need to do so using Xcode.

## Contributing

Before contributing, please read our [Longevity Statement](https://standardnotes.com/longevity) to better understand how we approach adding new features. Unlike other projects, adding new features is something we prefer _not_ to do, so if you have a feature which you think is absolutely essential, please create a discussion issue first before coding.
