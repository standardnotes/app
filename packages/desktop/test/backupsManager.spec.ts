import { promises as fs } from 'fs'
import path from 'path'

import anyTest, { TestFn } from 'ava'
import { createDriver, Driver } from './driver'

const test = anyTest as TestFn<Driver>

const BackupsDirectoryName = 'Standard Notes Backups'

test.beforeEach(async (t) => {
  t.context = await createDriver()
  const backupsLocation = await t.context.backups.location()
  await fs.rmdir(backupsLocation, { recursive: true })
  await t.context.backups.copyDecryptScript(backupsLocation)
})

test.afterEach.always(async (t) => {
  await t.context.stop()
})

/**
 * Depending on the current system load, performing a backup
 * might take a while
 */
const timeoutDuration = 20 * 1000 /** 20s */

function wait(duration = 1000) {
  return new Promise((resolve) => setTimeout(resolve, duration))
}

test('saves incoming data to the backups folder', async (t) => {
  const data = 'Sample Data'
  const fileName = await t.context.backups.save(data)
  const backupsLocation = await t.context.backups.location()
  const files = await fs.readdir(backupsLocation)
  t.true(files.includes(fileName))
  t.is(data, await fs.readFile(path.join(backupsLocation, fileName), 'utf8'))
})

test('saves the decrypt script to the backups folder', async (t) => {
  const backupsLocation = await t.context.backups.location()
  await wait(300) /** Disk might be busy */
  const files = await fs.readdir(backupsLocation)
  t.true(files.includes('decrypt.html'))
})

test('performs a backup', async (t) => {
  t.timeout(timeoutDuration)

  await wait()
  await t.context.backups.perform()
  const backupsLocation = await t.context.backups.location()
  const files = await fs.readdir(backupsLocation)

  t.true(files.length >= 1)
})

test('changes backups folder location', async (t) => {
  t.timeout(timeoutDuration)
  await wait()
  await t.context.backups.perform()
  let newLocation = path.join(t.context.userDataPath, 'newLocation')
  await fs.mkdir(newLocation)
  const currentLocation = await t.context.backups.location()
  const fileNames = await fs.readdir(currentLocation)
  await t.context.backups.changeLocation(newLocation)
  newLocation = path.join(newLocation, BackupsDirectoryName)
  t.deepEqual(fileNames, await fs.readdir(newLocation))

  /** Assert that the setting was saved */
  const data = await t.context.storage.dataOnDisk()
  t.is(data.backupsLocation, newLocation)

  /** Perform backup and make sure there is one more file in the directory */
  await t.context.backups.perform()
  const newFileNames = await fs.readdir(newLocation)
  t.deepEqual(newFileNames.length, fileNames.length + 1)
})

test('changes backups location to a child directory', async (t) => {
  t.timeout(timeoutDuration)

  await wait()
  await t.context.backups.perform()
  const currentLocation = await t.context.backups.location()
  const backups = await fs.readdir(currentLocation)

  t.is(backups.length, 2) /** 1 + decrypt script */

  const newLocation = path.join(currentLocation, 'child_dir')
  await t.context.backups.changeLocation(newLocation)

  t.deepEqual(await fs.readdir(path.join(newLocation, BackupsDirectoryName)), backups)
})

test('changing backups location to the same directory should not do anything', async (t) => {
  t.timeout(timeoutDuration)
  await wait()
  await t.context.backups.perform()
  await t.context.backups.perform()
  const currentLocation = await t.context.backups.location()
  let totalFiles = (await fs.readdir(currentLocation)).length
  t.is(totalFiles, 3) /** 2 + decrypt script */
  await t.context.backups.changeLocation(currentLocation)
  totalFiles = (await fs.readdir(currentLocation)).length
  t.is(totalFiles, 3)
})

test('backups are enabled by default', async (t) => {
  t.is(await t.context.backups.enabled(), true)
})

test('does not save a backup when they are disabled', async (t) => {
  await t.context.backups.toggleEnabled()
  await t.context.windowLoaded
  /** Do not wait on this one as the backup shouldn't be triggered */
  t.context.backups.perform()
  await wait()
  const backupsLocation = await t.context.backups.location()
  const files = await fs.readdir(backupsLocation)
  t.deepEqual(files, ['decrypt.html'])
})
