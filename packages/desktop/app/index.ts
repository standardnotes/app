/* eslint-disable no-console */
import { app, ipcMain, shell } from 'electron'
import log from 'electron-log'
import fs from 'fs-extra'
import path from 'path'
import './@types/modules'
import { initializeApplication } from './application'
import { enableExperimentalFeaturesForFileAccessFix } from './enableExperimentalWebFeatures'
import { Store } from './javascripts/Main/Store/Store'
import { StoreKeys } from './javascripts/Main/Store/StoreKeys'
import { isSnap } from './javascripts/Main/Types/Constants'
import { Paths } from './javascripts/Main/Types/Paths'
import { CommandLineArgs } from './javascripts/Shared/CommandLineArgs'

enableExperimentalFeaturesForFileAccessFix()

require('@electron/remote/main').initialize()

/** Allow a custom userData path to be used. */
const userDataPathIndex = process.argv.indexOf(CommandLineArgs.UserDataPath)

if (userDataPathIndex > 0) {
  let userDataPath = process.argv[userDataPathIndex + 1]
  if (typeof userDataPath === 'string') {
    userDataPath = path.resolve(userDataPath)

    /** Make sure the path is actually a writeable folder */
    try {
      fs.closeSync(fs.openSync(path.join(userDataPath, 'sn-test-file'), 'w'))
    } catch (e) {
      console.error('Failed to write to provided user data path. Aborting')
      app.exit(1)
    }

    app.setPath('userData', userDataPath)
  }
} else if (isSnap) {
  migrateSnapStorage()
}

log.transports.file.level = 'info'

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err)
})

initializeApplication({
  app,
  shell,
  ipcMain,
})

/**
 * By default, app.get('userData') points to the snap's current revision
 * folder. This causes issues when updating the snap while the app is
 * running, because it will not copy over anything that is saved to
 * localStorage or IndexedDB after the installation has completed.
 *
 * To counteract this, we change the userData directory to be the snap's
 * 'common' directory, shared by all revisions.
 * We also migrate existing content in the the default user folder to the
 * common directory.
 */
function migrateSnapStorage() {
  const snapUserCommonDir = process.env['SNAP_USER_COMMON']
  if (!snapUserCommonDir) {
    return
  }

  const legacyUserDataPath = app.getPath('userData')
  app.setPath('userData', snapUserCommonDir)
  console.log(`Set user data dir to ${snapUserCommonDir}`)

  const legacyFiles = fs
    .readdirSync(legacyUserDataPath)
    .filter(
      (fileName) =>
        fileName !== 'SS' &&
        fileName !== 'SingletonLock' &&
        fileName !== 'SingletonCookie' &&
        fileName !== 'Dictionaries' &&
        fileName !== 'Standard Notes',
    )

  if (legacyFiles.length) {
    for (const fileName of legacyFiles) {
      const fullFilePath = path.join(legacyUserDataPath, fileName)
      const dest = snapUserCommonDir
      console.log(`Migration: moving ${fullFilePath} to ${dest}`)
      try {
        fs.moveSync(fullFilePath, path.join(dest, fileName), {
          overwrite: false,
        })
      } catch (error) {
        console.error(
          `Migration: error occured while moving ${fullFilePath} to ${dest}:`,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any)?.message ?? error,
        )
      }
    }

    console.log(`Migration: finished moving contents to ${snapUserCommonDir}.`)

    const snapUserData = process.env['SNAP_USER_DATA']
    const store = new Store(snapUserCommonDir)
    if (
      snapUserData &&
      store.data.backupsLocation &&
      store.data.backupsLocation.startsWith(path.resolve(snapUserData, '..'))
    ) {
      /**
       * Backups location has not been altered by the user. Move it to the
       * user documents directory
       */
      const documentsDir = Paths.documentsDir
      console.log(`Migration: moving ${store.data.backupsLocation} to ${documentsDir}`)
      if (documentsDir) {
        const newLocation = path.join(documentsDir, path.basename(store.data.backupsLocation))
        try {
          fs.copySync(store.data.backupsLocation, newLocation)
        } catch (error) {
          console.error(
            `Migration: error occured while moving ${store.data.backupsLocation} to ${documentsDir}:`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any)?.message ?? error,
          )
        }
        store.set(StoreKeys.LegacyTextBackupsLocation, newLocation)
        console.log('Migration: finished moving backups directory.')
      }
    }
  }
}
