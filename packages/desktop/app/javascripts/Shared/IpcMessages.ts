export enum MessageToWebApp {
  UpdateAvailable = 'update-available',
  WindowBlurred = 'window-blurred',
  WindowFocused = 'window-focused',
  InstallComponentComplete = 'install-component-complete',
  WatchedDirectoriesChanges = 'watched-directories-changes',
  HomeServerStarted = 'home-server-started',
  ConsoleLog = 'console-log',
}

export enum MessageToMainProcess {
  UseLocalstorageForKeychain = 'UseLocalstorageForKeychain',
  LearnMoreAboutKeychainAccess = 'LearnMoreAboutKeychainAccess',
  Quit = 'Quit',
}
