import anyTest, { ExecutionContext, TestFn } from 'ava'
import fs from 'fs'
import path from 'path'
import proxyquire from 'proxyquire'
import { timeout } from '../app/javascripts/Main/Utils/Utils'
import { createDriver, Driver } from './driver'

const { serializeStoreData } = proxyquire('../app/javascripts/Main/Store', {
  './backupsManager': {
    '@noCallThru': true,
  },
  '@electron': {
    '@noCallThru': true,
  },
  '@electron/remote': {
    '@noCallThru': true,
  },
})

async function validateData(t: ExecutionContext<Driver>) {
  const data = await t.context.storage.dataOnDisk()

  /**
   * There should always be 8 values in the store.
   * If one was added/removed intentionally, update this number
   */
  const numberOfStoreKeys = 10
  t.is(Object.keys(data).length, numberOfStoreKeys)

  t.is(typeof data.isMenuBarVisible, 'boolean')

  t.is(typeof data.useSystemMenuBar, 'boolean')

  t.is(typeof data.backupsDisabled, 'boolean')

  t.is(typeof data.minimizeToTray, 'boolean')

  t.is(typeof data.enableAutoUpdates, 'boolean')

  t.is(typeof data.zoomFactor, 'number')
  t.true(data.zoomFactor > 0)

  t.is(typeof data.extServerHost, 'string')
  /** Must not throw */
  const extServerHost = new URL(data.extServerHost)
  t.is(extServerHost.hostname, '127.0.0.1')
  t.is(extServerHost.protocol, 'http:')
  t.is(extServerHost.port, '45653')

  t.is(typeof data.backupsLocation, 'string')

  t.is(data.useNativeKeychain, null)

  if (process.platform === 'darwin') {
    t.is(data.selectedSpellCheckerLanguageCodes, null)
  } else {
    t.true(Array.isArray(data.selectedSpellCheckerLanguageCodes))
    for (const language of data.selectedSpellCheckerLanguageCodes) {
      t.is(typeof language, 'string')
    }
  }
}

const test = anyTest as TestFn<Driver>

test.beforeEach(async (t) => {
  t.context = await createDriver()
})
test.afterEach.always((t) => {
  return t.context.stop()
})

test('has valid data', async (t) => {
  await validateData(t)
})

test('recreates a missing data file', async (t) => {
  const location = await t.context.storage.dataLocation()
  /** Delete the store's backing file */
  await fs.promises.unlink(location)
  await t.context.restart()
  await validateData(t)
})

test('recovers from corrupted data', async (t) => {
  const location = await t.context.storage.dataLocation()
  /** Write bad data in the store's file */
  await fs.promises.writeFile(location, '\uFFFF'.repeat(300))
  await t.context.restart()
  await validateData(t)
})

test('persists changes to disk after setting a value', async (t) => {
  const factor = 4.8
  await t.context.storage.setZoomFactor(factor)
  const diskData = await t.context.storage.dataOnDisk()
  t.is(diskData.zoomFactor, factor)
})

test('serializes string sets to an array', (t) => {
  t.deepEqual(
    serializeStoreData({
      set: new Set(['value']),
    } as any),
    JSON.stringify({
      set: ['value'],
    }),
  )
})

test('deletes local storage data after signing out', async (t) => {
  function readLocalStorageContents() {
    return fs.promises.readFile(path.join(t.context.userDataPath, 'Local Storage', 'leveldb', '000003.log'), {
      encoding: 'utf8',
    })
  }
  await t.context.windowLoaded
  await t.context.storage.setLocalStorageValue('foo', 'bar')
  let localStorageContents = await readLocalStorageContents()

  t.is(localStorageContents.includes('foo'), true)
  t.is(localStorageContents.includes('bar'), true)

  await timeout(1_000)
  await t.context.window.signOut()
  await timeout(1_000)
  localStorageContents = await readLocalStorageContents()
  t.is(localStorageContents.includes('foo'), false)
  t.is(localStorageContents.includes('bar'), false)
})
