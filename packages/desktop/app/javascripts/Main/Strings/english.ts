import { Strings } from './types'

export function createEnglishStrings(): Strings {
  return {
    appMenu: {
      edit: 'Edit',
      view: 'View',
      hideMenuBar: 'Hide Menu Bar',
      useThemedMenuBar: 'Use Themed Menu Bar',
      minimizeToTrayOnClose: 'Minimize To Tray On Close',
      backups: 'Backups',
      enableAutomaticUpdates: 'Enable Automatic Updates',
      automaticUpdatesDisabled: 'Automatic Updates Disabled',
      disableAutomaticBackups: 'Disable Automatic Backups',
      enableAutomaticBackups: 'Enable Automatic Backups',
      emailSupport: 'Email Support',
      website: 'Website',
      gitHub: 'GitHub',
      discord: 'Discord',
      twitter: 'Twitter',
      toggleErrorConsole: 'Toggle Error Console',
      openDataDirectory: 'Open Data Directory',
      clearCacheAndReload: 'Clear Cache and Reload',
      speech: 'Speech',
      close: 'Close',
      minimize: 'Minimize',
      zoom: 'Zoom',
      bringAllToFront: 'Bring All to Front',
      checkForUpdate: 'Check for Update',
      checkingForUpdate: 'Checking for update…',
      updateAvailable: '(1) Update Available',
      updates: 'Updates',
      releaseNotes: 'Release Notes',
      openDownloadLocation: 'Open Download Location',
      downloadingUpdate: 'Downloading Update…',
      manuallyDownloadUpdate: 'Manually Download Update',
      spellcheckerLanguages: 'Spellchecker Languages',
      installPendingUpdate(versionNumber: string) {
        return `Install Pending Update (${versionNumber})`
      },
      lastUpdateCheck(date: Date) {
        return `Last checked ${date.toLocaleString()}`
      },
      version(number: string) {
        return `Version: ${number}`
      },
      yourVersion(number: string) {
        return `Your Version: ${number}`
      },
      latestVersion(number: string) {
        return `Latest Version: ${number}`
      },
      viewReleaseNotes(versionNumber: string) {
        return `View ${versionNumber} Release Notes`
      },
      preferencesChanged: {
        title: 'Preference Changed',
        message:
          'Your menu bar preference has been saved. Please restart the ' + 'application for the change to take effect.',
      },
      security: {
        security: 'Security',
        useKeyringtoStorePassword: 'Use password storage to store password',
        enabledKeyringAccessMessage:
          "Standard Notes will try to use your system's password storage " +
          'facility to store your password the next time you start it.',
        enabledKeyringQuitNow: 'Quit Now',
        enabledKeyringPostpone: 'Postpone',
      },
    },
    contextMenu: {
      learnSpelling: 'Learn Spelling',
      noSuggestions: 'No Suggestions',
    },
    tray: {
      show: 'Show',
      hide: 'Hide',
      quit: 'Quit',
    },
    extensions: {
      missingExtension:
        'The extension was not found on your system, possibly because it is ' +
        "still downloading. If the extension doesn't load, " +
        'try uninstalling then reinstalling the extension.',
      unableToLoadExtension:
        'Unable to load extension. Please restart the application and ' +
        'try again. If the issue persists, try uninstalling then ' +
        'reinstalling the extension.',
    },
    updates: {
      automaticUpdatesEnabled: {
        title: 'Automatic Updates Enabled.',
        message:
          'Automatic updates have been enabled. Please note that ' +
          'this functionality is currently in beta, and that you are advised ' +
          'to periodically check in and ensure you are running the ' +
          'latest version.',
      },
      finishedChecking: {
        title: 'Finished checking for updates.',
        error(description: string) {
          return (
            'An issue occurred while checking for updates. ' +
            'Please try again.\nIf this issue persists please contact ' +
            `support with the following information: ${description}`
          )
        },
        updateAvailable(newVersion: string) {
          return (
            `A new update is available (version ${newVersion}). ` +
            'You can wait for the app to update itself, or manually ' +
            'download and install this update.'
          )
        },
        noUpdateAvailable(currentVersion: string) {
          return `Your version (${currentVersion}) is the latest available version.`
        },
      },
      updateReady: {
        title: 'Update Ready',
        message(version: string) {
          return `A new update (version ${version}) is ready to install.`
        },
        quitAndInstall: 'Quit and Install',
        installLater: 'Install Later',
        noRecentBackupMessage:
          'An update is ready to install, but your backups folder does not ' +
          'appear to contain a recent enough backup. Please download a ' +
          'backup manually before proceeding with the installation.',
        noRecentBackupDetail(lastBackupDate: number | null) {
          const downloadInstructions =
            'You can download a backup from the Account menu ' + 'in the bottom-left corner of the app.'
          const lastAutomaticBackup =
            lastBackupDate === null
              ? 'Your backups folder is empty.'
              : `Your latest automatic backup is from ${new Date(lastBackupDate).toLocaleString()}.`
          return `${downloadInstructions}\n${lastAutomaticBackup}`
        },
        noRecentBackupChecbox: 'I have downloaded a backup, proceed with installation',
      },
      errorDownloading: {
        title: 'Error Downloading',
        message: 'An error occurred while trying to download your ' + 'update file. Please try again.',
      },
      unknownVersionName: 'Unknown',
    },
  }
}
