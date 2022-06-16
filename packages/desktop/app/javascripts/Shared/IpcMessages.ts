export enum MessageToWebApp {
  UpdateAvailable = 'update-available',
  PerformAutomatedBackup = 'download-backup',
  FinishedSavingBackup = 'finished-saving-backup',
  WindowBlurred = 'window-blurred',
  WindowFocused = 'window-focused',
  InstallComponentComplete = 'install-component-complete',
}

export enum MessageToMainProcess {
  UseLocalstorageForKeychain = 'UseLocalstorageForKeychain',
  LearnMoreAboutKeychainAccess = 'LearnMoreAboutKeychainAccess',
  Quit = 'Quit',
}
