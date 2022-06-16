import test from 'ava'
import { promises as fs } from 'fs'
import path from 'path'
import proxyquire from 'proxyquire'
import { PackageManagerInterface } from '../app/javascripts/Main/Packages/PackageManagerInterface'
import { AppName } from '../app/javascripts/Main/strings'
import { ensureDirectoryExists, readJSONFile } from '../app/javascripts/Main/Utils/FileUtils'
import makeFakePaths from './fakePaths'
import { createTmpDir } from './testUtils'

const tmpDir = createTmpDir(__filename)
const FakePaths = makeFakePaths(tmpDir.path)

const contentDir = path.join(tmpDir.path, 'Extensions')
let downloadFileCallCount = 0

const { initializePackageManager } = proxyquire('../app/javascripts/Main/Packages/PackageManager', {
  './paths': {
    Paths: FakePaths,
    '@noCallThru': true,
  },
  './networking': {
    /** Download a fake component file */
    async downloadFile(_src: string, dest: string) {
      downloadFileCallCount += 1
      if (!path.normalize(dest).startsWith(tmpDir.path)) {
        throw new Error(`Bad download destination: ${dest}`)
      }
      await ensureDirectoryExists(path.dirname(dest))
      await fs.copyFile(path.join(__dirname, 'data', 'zip-file.zip'), path.join(dest))
    },
  },
})

const fakeWebContents = {
  send(_eventName: string, { error }) {
    if (error) throw error
  },
}

const name = 'Fake Component'
const identifier = 'fake.component'
const uuid = 'fake-component'
const version = '1.0.0'
const modifiers = Array(20)
  .fill(0)
  .map((_, i) => String(i).padStart(2, '0'))

function fakeComponent({ deleted = false, modifier = '' } = {}) {
  return {
    uuid: uuid + modifier,
    deleted,
    content: {
      name: name + modifier,
      autoupdateDisabled: false,
      package_info: {
        version,
        identifier: identifier + modifier,
        download_url: 'https://standardnotes.com',
        url: 'https://standardnotes.com',
        latest_url: 'https://standardnotes.com',
      },
    },
  }
}

let packageManager: PackageManagerInterface

const log = console.log
const error = console.error

test.before(async function () {
  /** Silence the package manager's output. */
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.error = () => {}
  await ensureDirectoryExists(contentDir)
  packageManager = await initializePackageManager(fakeWebContents)
})

test.after.always(async function () {
  console.log = log
  console.error = error
  await tmpDir.clean()
})

test.beforeEach(function () {
  downloadFileCallCount = 0
})

test('installs multiple components', async (t) => {
  await packageManager.syncComponents(modifiers.map((modifier) => fakeComponent({ modifier })))
  await new Promise((resolve) => setTimeout(resolve, 200))

  const files = await fs.readdir(contentDir)
  t.is(files.length, 1 + modifiers.length)
  for (const modifier of modifiers) {
    t.true(files.includes(identifier + modifier))
  }
  t.true(files.includes('mapping.json'))
  const mappingContents = await fs.readFile(path.join(contentDir, 'mapping.json'), 'utf8')

  t.deepEqual(
    JSON.parse(mappingContents),
    modifiers.reduce((acc, modifier) => {
      acc[uuid + modifier] = {
        location: path.join('Extensions', identifier + modifier),
        version,
      }
      return acc
    }, {}),
  )

  const downloads = await fs.readdir(path.join(tmpDir.path, AppName, 'downloads'))
  t.is(downloads.length, modifiers.length)
  for (const modifier of modifiers) {
    t.true(downloads.includes(`${name + modifier}.zip`))
  }

  for (const modifier of modifiers) {
    const componentFiles = await fs.readdir(path.join(contentDir, identifier + modifier))
    t.is(componentFiles.length, 2)
  }
})

test('uninstalls multiple components', async (t) => {
  await packageManager.syncComponents(modifiers.map((modifier) => fakeComponent({ deleted: true, modifier })))
  await new Promise((resolve) => setTimeout(resolve, 200))

  const files = await fs.readdir(contentDir)
  t.deepEqual(files, ['mapping.json'])

  t.deepEqual(await readJSONFile(path.join(contentDir, 'mapping.json')), {})
})

test("doesn't download anything when two install/uninstall tasks are queued", async (t) => {
  await Promise.all([
    packageManager.syncComponents([fakeComponent({ deleted: false })]),
    packageManager.syncComponents([fakeComponent({ deleted: false })]),
    packageManager.syncComponents([fakeComponent({ deleted: true })]),
  ])
  t.is(downloadFileCallCount, 1)
})

test("Relies on download_url's version field to store the version number", async (t) => {
  await packageManager.syncComponents([fakeComponent()])
  await new Promise((resolve) => setTimeout(resolve, 200))

  const mappingFileVersion = JSON.parse(await fs.readFile(path.join(contentDir, 'mapping.json'), 'utf8'))[uuid].version

  const packageJsonVersion = JSON.parse(
    await fs.readFile(path.join(contentDir, identifier, 'package.json'), 'utf-8'),
  ).version

  t.not(mappingFileVersion, packageJsonVersion)
  t.is(mappingFileVersion, version)
})
