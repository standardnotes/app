export enum MessageToWebApp {
  UpdateAvailable = 'update-available',
  WindowBlurred = 'window-blurred',
  WindowFocused = 'window-focused',
  InstallComponentComplete = 'install-component-complete',
  WatchedDirectoriesChanges = 'watched-directories-changes',
  HomeServerConfigurationChanged = 'home-server-configuration-changed',
}

export enum MessageToMainProcess {
  UseLocalstorageForKeychain = 'UseLocalstorageForKeychain',
  LearnMoreAboutKeychainAccess = 'LearnMoreAboutKeychainAccess',
  Quit = 'Quit',
}
