export enum MessageToWebApp {
  UpdateAvailable = 'update-available',
  WindowBlurred = 'window-blurred',
  WindowFocused = 'window-focused',
  InstallComponentComplete = 'install-component-complete',
}

export enum MessageToMainProcess {
  UseLocalstorageForKeychain = 'UseLocalstorageForKeychain',
  LearnMoreAboutKeychainAccess = 'LearnMoreAboutKeychainAccess',
  Quit = 'Quit',
}
