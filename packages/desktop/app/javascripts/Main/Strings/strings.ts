import { c } from 'ttag'
import { Strings } from './types'

export function createStrings(): Strings {
  return {
    appMenu: {
      edit: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Edit`,
      view: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`View`,
      hideMenuBar: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Hide Menu Bar`,
      useThemedMenuBar: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Use Themed Menu Bar`,
      minimizeToTrayOnClose: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Minimize To Tray On Close`,
      backups: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Backups`,
      enableAutomaticUpdates: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Enable Automatic Updates`,
      automaticUpdatesDisabled: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Automatic Updates Disabled`,
      disableAutomaticBackups: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Disable Automatic Backups`,
      enableAutomaticBackups: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Enable Automatic Backups`,
      emailSupport: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Email Support`,
      website: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Website`,
      gitHub: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`GitHub`,
      discord: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Discord`,
      twitter: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Twitter`,
      toggleErrorConsole: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Toggle Error Console`,
      openDataDirectory: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Open Data Directory`,
      clearCacheAndReload: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Clear Cache and Reload`,
      speech: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Speech`,
      close: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Close`,
      minimize: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Minimize`,
      zoom: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Zoom`,
      bringAllToFront: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Bring All to Front`,
      checkForUpdate: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Check for Update`,
      checkingForUpdate: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Checking for update…`,
      updateAvailable: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`(1) Update Available`,
      updates: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Updates`,
      releaseNotes: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Release Notes`,
      openDownloadLocation: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Open Download Location`,
      downloadingUpdate: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Downloading Update…`,
      manuallyDownloadUpdate: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Manually Download Update`,
      spellcheckerLanguages: c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Spellchecker Languages`,
      installPendingUpdate(versionNumber: string) {
        return c('B8.MobileDesktopShared.Desktop.Menu.Label').t`Install Pending Update (${versionNumber})`
      },
      lastUpdateCheck(date: Date) {
        const dateString = date.toLocaleString()
        return c('B8.MobileDesktopShared.Desktop.Menu.Info').t`Last checked ${dateString}`
      },
      version(number: string) {
        return c('B8.MobileDesktopShared.Desktop.Menu.Info').t`Version: ${number}`
      },
      yourVersion(number: string) {
        return c('B8.MobileDesktopShared.Desktop.Menu.Info').t`Your Version: ${number}`
      },
      latestVersion(number: string) {
        return c('B8.MobileDesktopShared.Desktop.Menu.Info').t`Latest Version: ${number}`
      },
      viewReleaseNotes(versionNumber: string) {
        return c('B8.MobileDesktopShared.Desktop.Menu.Label').t`View ${versionNumber} Release Notes`
      },
      preferencesChanged: {
        title: c('B8.MobileDesktopShared.Desktop.Menu.Title').t`Preference Changed`,
        message: c('B8.MobileDesktopShared.Desktop.Menu.Info')
          .t`Your menu bar preference has been saved. Please restart the application for the change to take effect.`,
      },
      security: {
        security: c('B8.MobileDesktopShared.Desktop.Security.Label').t`Security`,
        useKeyringtoStorePassword: c('B8.MobileDesktopShared.Desktop.Security.Label')
          .t`Use password storage to store password`,
        enabledKeyringAccessMessage: c('B8.MobileDesktopShared.Desktop.Security.Info')
          .t`Standard Notes will try to use your system's password storage facility to store your password the next time you start it.`,
        enabledKeyringQuitNow: c('B8.MobileDesktopShared.Desktop.Security.Action').t`Quit Now`,
        enabledKeyringPostpone: c('B8.MobileDesktopShared.Desktop.Security.Action').t`Postpone`,
      },
    },
    contextMenu: {
      learnSpelling: c('B8.MobileDesktopShared.Desktop.ContextMenu.Label').t`Learn Spelling`,
      noSuggestions: c('B8.MobileDesktopShared.Desktop.ContextMenu.Label').t`No Suggestions`,
    },
    tray: {
      show: c('B8.MobileDesktopShared.Desktop.Tray.Label').t`Show`,
      hide: c('B8.MobileDesktopShared.Desktop.Tray.Label').t`Hide`,
      quit: c('B8.MobileDesktopShared.Desktop.Tray.Label').t`Quit`,
    },
    extensions: {
      missingExtension: c('B8.MobileDesktopShared.Desktop.Extensions.Error')
        .t`The extension was not found on your system, possibly because it is still downloading. If the extension doesn't load, try uninstalling then reinstalling the extension.`,
      unableToLoadExtension: c('B8.MobileDesktopShared.Desktop.Extensions.Error')
        .t`Unable to load extension. Please restart the application and try again. If the issue persists, try uninstalling then reinstalling the extension.`,
    },
    updates: {
      automaticUpdatesEnabled: {
        title: c('B8.MobileDesktopShared.Desktop.Updates.Title').t`Automatic Updates Enabled.`,
        message: c('B8.MobileDesktopShared.Desktop.Updates.Info')
          .t`Automatic updates have been enabled. Please note that this functionality is currently in beta, and that you are advised to periodically check in and ensure you are running the latest version.`,
      },
      finishedChecking: {
        title: c('B8.MobileDesktopShared.Desktop.Updates.Title').t`Finished checking for updates.`,
        error(description: string) {
          return c('B8.MobileDesktopShared.Desktop.Updates.Error')
            .t`An issue occurred while checking for updates. Please try again.\nIf this issue persists please contact support with the following information: ${description}`
        },
        updateAvailable(newVersion: string) {
          return c('B8.MobileDesktopShared.Desktop.Updates.Info')
            .t`A new update is available (version ${newVersion}). You can wait for the app to update itself, or manually download and install this update.`
        },
        noUpdateAvailable(currentVersion: string) {
          return c('B8.MobileDesktopShared.Desktop.Updates.Info')
            .t`Your version (${currentVersion}) is the latest available version.`
        },
      },
      updateReady: {
        title: c('B8.MobileDesktopShared.Desktop.Updates.Title').t`Update Ready`,
        message(version: string) {
          return c('B8.MobileDesktopShared.Desktop.Updates.Info')
            .t`A new update (version ${version}) is ready to install.`
        },
        quitAndInstall: c('B8.MobileDesktopShared.Desktop.Updates.Action').t`Quit and Install`,
        installLater: c('B8.MobileDesktopShared.Desktop.Updates.Action').t`Install Later`,
        noRecentBackupMessage: c('B8.MobileDesktopShared.Desktop.Updates.Info')
          .t`An update is ready to install, but your backups folder does not appear to contain a recent enough backup. Please download a backup manually before proceeding with the installation.`,
        noRecentBackupDetail(lastBackupDate: number | null) {
          const downloadInstructions = c('B8.MobileDesktopShared.Desktop.Updates.Info')
            .t`You can download a backup from the Account menu in the bottom-left corner of the app.`
          const lastAutomaticBackup =
            lastBackupDate === null
              ? c('B8.MobileDesktopShared.Desktop.Updates.Info').t`Your backups folder is empty.`
              : (() => {
                  const backupDateString = new Date(lastBackupDate).toLocaleString()
                  return c('B8.MobileDesktopShared.Desktop.Updates.Info')
                    .t`Your latest automatic backup is from ${backupDateString}.`
                })()
          return `${downloadInstructions}\n${lastAutomaticBackup}`
        },
        noRecentBackupChecbox: c('B8.MobileDesktopShared.Desktop.Updates.Label')
          .t`I have downloaded a backup, proceed with installation`,
      },
      errorDownloading: {
        title: c('B8.MobileDesktopShared.Desktop.Updates.Title').t`Error Downloading`,
        message: c('B8.MobileDesktopShared.Desktop.Updates.Error')
          .t`An error occurred while trying to download your update file. Please try again.`,
      },
      unknownVersionName: c('B8.MobileDesktopShared.Desktop.Updates.Info').t`Unknown`,
    },
  }
}
