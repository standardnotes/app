export interface Strings {
  appMenu: AppMenuStrings
  contextMenu: ContextMenuStrings
  tray: TrayStrings
  extensions: ExtensionsStrings
  updates: UpdateStrings
}

interface AppMenuStrings {
  edit: string
  view: string
  hideMenuBar: string
  useThemedMenuBar: string
  minimizeToTrayOnClose: string
  backups: string
  enableAutomaticUpdates: string
  automaticUpdatesDisabled: string
  disableAutomaticBackups: string
  enableAutomaticBackups: string
  emailSupport: string
  website: string
  gitHub: string
  discord: string
  twitter: string
  toggleErrorConsole: string
  openDataDirectory: string
  clearCacheAndReload: string
  speech: string
  close: string
  minimize: string
  zoom: string
  bringAllToFront: string
  checkForUpdate: string
  checkingForUpdate: string
  updateAvailable: string
  updates: string
  releaseNotes: string
  openDownloadLocation: string
  downloadingUpdate: string
  manuallyDownloadUpdate: string
  spellcheckerLanguages: string
  installPendingUpdate(versionNumber: string): string
  lastUpdateCheck(date: Date): string
  version(number: string): string
  yourVersion(number: string): string
  latestVersion(number: string): string
  viewReleaseNotes(versionNumber: string): string
  preferencesChanged: {
    title: string
    message: string
  }
  security: {
    security: string
    useKeyringtoStorePassword: string
    enabledKeyringAccessMessage: string
    enabledKeyringQuitNow: string
    enabledKeyringPostpone: string
  }
}

interface ContextMenuStrings {
  learnSpelling: string
  noSuggestions: string
}

interface TrayStrings {
  show: string
  hide: string
  quit: string
}

interface ExtensionsStrings {
  unableToLoadExtension: string
  missingExtension: string
}

interface UpdateStrings {
  automaticUpdatesEnabled: {
    title: string
    message: string
  }
  finishedChecking: {
    title: string
    error(description: string): string
    updateAvailable(newVersion: string): string
    noUpdateAvailable(currentVersion: string): string
  }
  updateReady: {
    title: string
    message(version: string): string
    quitAndInstall: string
    installLater: string
    noRecentBackupMessage: string
    noRecentBackupDetail(lastBackupDate: number | null): string
    noRecentBackupChecbox: string
  }
  errorDownloading: {
    title: string
    message: string
  }
  unknownVersionName: string
}
