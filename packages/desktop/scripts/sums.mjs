import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const ScriptsDir = path.dirname(__filename)

import { doesFileExist } from '../../../scripts/ScriptUtils.mjs'

function sha256(filePath) {
  if (!doesFileExist(filePath)) {
    console.log('Attempting to hash non-existing file', filePath)
    return null
  }

  return new Promise((resolve) => {
    try {
      fs.createReadStream(filePath)
        .pipe(crypto.createHash('sha256').setEncoding('hex'))
        .on('finish', function () {
          resolve(this.read())
        })
        .on('error', function () {
          resolve(null)
        })
    } catch (error) {
      console.log('Error reading file', error)
      resolve(null)
    }
  })
}

async function getFileNames() {
  const packageJson = await fs.promises.readFile(path.join(ScriptsDir, '../package.json'))
  const version = JSON.parse(packageJson).version
  return [
    `standard-notes-${version}-mac-x64.zip`,
    `standard-notes-${version}-mac-x64.dmg`,
    `standard-notes-${version}-mac-x64.dmg.blockmap`,

    `standard-notes-${version}-mac-arm64.zip`,
    `standard-notes-${version}-mac-arm64.dmg`,
    `standard-notes-${version}-mac-arm64.dmg.blockmap`,

    `standard-notes-${version}-linux-i386.AppImage`,
    `standard-notes-${version}-linux-x86_64.AppImage`,
    `standard-notes-${version}-linux-amd64.snap`,

    `standard-notes-${version}-linux-arm64.deb`,
    `standard-notes-${version}-linux-arm64.AppImage`,

    `standard-notes-${version}-win-x64.exe`,
    `standard-notes-${version}-win-x64.exe.blockmap`,

    `standard-notes-${version}-win.exe`,
    `standard-notes-${version}-win.exe.blockmap`,

    `standard-notes-${version}-win-ia32.exe`,
    `standard-notes-${version}-win-ia32.exe.blockmap`,

    'latest-linux-ia32.yml',
    'latest-linux.yml',
    'latest-linux-arm64.yml',
    'latest-mac.yml',
    'latest.yml',
    'builder-effective-config.yaml',
  ]
}

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err)
})
;(async () => {
  console.log('Writing SHA256 sums to dist/SHA256SUMS')

  try {
    const files = await getFileNames()

    let hashes = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(ScriptsDir, `../dist/${fileName}`)
        try {
          const hash = await sha256(filePath)
          const entry = `${hash}  ${fileName}`
          return entry
        } catch (error) {
          console.error('Unable to hash file', filePath)
          return null
        }
      }),
    )

    hashes = hashes.join('\n')
    await fs.promises.writeFile(path.join(ScriptsDir, '../dist/SHA256SUMS'), hashes)
    console.log(`Successfully wrote SHA256SUMS:\n${hashes}`)
  } catch (err) {
    console.error(err)
  }
})()
