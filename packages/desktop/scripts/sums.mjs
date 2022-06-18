import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const ScriptsDir = path.dirname(__filename)

import { doesFileExist, listDirFiles } from '../../../scripts/ScriptUtils.mjs'

function sha256(filePath) {
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

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err)
})
;(async () => {
  console.log('Writing SHA256 sums to dist/SHA256SUMS')

  try {
    const distDir = path.join(ScriptsDir, '../dist')
    const fileNames = listDirFiles(distDir)
    const filePaths = fileNames.map((fileName) => path.join(distDir, fileName))

    const entries = []

    for (const filePath of filePaths) {
      if (!doesFileExist(filePath)) {
        console.log('Attempting to hash non-existing file', filePath)
        continue
      }
      if (fs.lstatSync(filePath).isDirectory()) {
        console.log('Attempting to hash directory', filePath)
        continue
      }

      try {
        const hash = await sha256(filePath)
        const fileName = path.basename(filePath)
        const entry = `${hash}  ${fileName}`
        entries.push(entry)
      } catch (error) {
        console.error('Unable to hash file', filePath)
        continue
      }
    }

    const hashes = entries.join('\n')
    await fs.promises.writeFile(path.join(ScriptsDir, '../dist/SHA256SUMS'), hashes)
    console.log(`Successfully wrote SHA256SUMS:\n${hashes}`)
  } catch (err) {
    console.error('Error generating checksums', err)
  }
})()
