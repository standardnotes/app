import fs from 'fs'
import path from 'path'
import { Command } from './Command.mjs'
import { runCommand } from './runCommand.mjs'
import { DesktopDir } from './build.mjs'

export async function publishSnap() {
  try {
    const packageJson = await fs.promises.readFile(path.join(DesktopDir, 'package.json'))
    const version = JSON.parse(packageJson).version
    await runCommand(Command(`snapcraft upload dist/standard-notes-${version}-linux-amd64.snap`, DesktopDir))
  } catch (error) {
    console.error('Error publishing snap', error)
  }
}
