import fs from 'fs'
import path from 'path'
import { Command } from './Command'
import { runCommand } from './runCommand'
import { DesktopDir } from './build'

export async function publishSnap() {
  const packageJson = await fs.promises.readFile(path.join(DesktopDir, 'package.json'))
  const version = JSON.parse(packageJson).version
  await runCommand(Command(`snapcraft upload dist/standard-notes-${version}-linux-amd64.snap`, DesktopDir))
}
