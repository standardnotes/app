import crypto from 'crypto'
import fs from 'fs'
import { getLatestBuiltFilesList } from './utils.mjs'

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(crypto.createHash('sha256').setEncoding('hex'))
      .on('finish', function () {
        resolve(this.read())
      })
      .on('error', reject)
  })
}

;(async () => {
  console.log('Writing SHA256 sums to dist/SHA256SUMS')

  try {
    const files = await getLatestBuiltFilesList()

    process.chdir('dist')

    let hashes = await Promise.all(
      files.map(async (fileName) => {
        const hash = await sha256(fileName)
        return `${hash}  ${fileName}`
      }),
    )
    hashes = hashes.join('\n')
    await fs.promises.writeFile('SHA256SUMS', hashes)
    console.log(`Successfully wrote SHA256SUMS:\n${hashes}`)
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()
