/*
 * There is an issue with electron-builder generating invalid zip files for Catalina.
 * This is a script implementation of the following workaround:
 * https://snippets.cacher.io/snippet/354a3eb7b0dcbe711383
 */

const fs = require('fs')
const childProcess = require('child_process')
const yaml = require('js-yaml')
const assert = require('assert').strict
const os = require('os')

function exec(command) {
  console.log(command)
  return new Promise((resolve, reject) => {
    childProcess.exec(command, (err, stdout, stderr) => {
      if (err) reject(err)
      else if (stderr) reject(Error(stderr))
      else resolve(stdout)
    })
  })
}

async function getBlockMapInfo(fileName) {
  return JSON.parse(
    await exec(
      './node_modules/app-builder-bin/mac/app-builder_amd64 blockmap' + ` -i ${fileName}` + ` -o ${os.tmpdir()}/a.zip`,
    ),
  )
}

;(async () => {
  try {
    const version = process.argv.slice(2)[0]
    const zipName = `standard-notes-${version}-mac-x64.zip`
    const zipPath = `dist/${zipName}`
    console.log(`Removing ${zipPath}`)
    await fs.promises.unlink(zipPath)

    process.chdir('dist/mac')
    const appName = process.argv.includes('--beta') ? 'Standard\\ Notes\\ \\(Beta\\).app' : 'Standard\\ Notes.app'

    /** @see https://superuser.com/questions/574032/what-is-the-equivalent-unix-command-to-a-mac-osx-compress-menu-action */
    await exec(`ditto -c -k --sequesterRsrc --keepParent ${appName} ../${zipName}`)
    process.chdir('../..')

    const [blockMapInfo, latestVersionInfo] = await Promise.all([
      getBlockMapInfo(zipPath),
      fs.promises.readFile('dist/latest-mac.yml').then(yaml.load),
    ])
    const index = latestVersionInfo.files.findIndex((file) => file.url === zipName)
    assert(index >= 0)
    latestVersionInfo.files[index] = {
      ...latestVersionInfo.files[index],
      ...blockMapInfo,
    }
    latestVersionInfo.sha512 = blockMapInfo.sha512
    console.log('Writing new size, hash and blockMap size to dist/latest-mac.yml')
    await fs.promises.writeFile(
      'dist/latest-mac.yml',
      yaml.dump(latestVersionInfo, {
        lineWidth: Infinity,
      }),
      'utf8',
    )
  } catch (err) {
    console.error(err)
    process.exitCode = 1
  }
})()
