import { LocalServerManagerInterface } from './LocalServerManagerInterface'
import { spawn } from 'child_process'
const os = require('os')
const path = require('path')
const fs = require('fs')

type Command = {
  prompt: string
  extraEnv: Record<string, string>
}

const CreateCommand = (prompt: string, extraEnv: Record<string, string> = {}): Command => {
  return { prompt, extraEnv }
}

function runCommand(commandObj: Command, workingDir?: string) {
  console.log('runCommand', commandObj, workingDir)
  return new Promise((resolve, reject) => {
    const { prompt, extraEnv } = commandObj
    console.log(prompt, Object.keys(extraEnv).length > 0 ? extraEnv : '')
    const [command, ...args] = prompt.split(' ')
    const options = { env: Object.assign({}, process.env, extraEnv), cwd: workingDir }
    const child = spawn(command, args, options)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    child.on('error', reject)
    child.on('close', (code) => {
      if (code! > 0) {
        reject(code)
      } else {
        resolve(code)
      }
    })
  })
}

export class LocalServiceManager implements LocalServerManagerInterface {
  async start(): Promise<void> {
    const notesDir = path.join(this.getDocumentsDir(), 'notes')
    console.log('notesDir', notesDir)
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir)
    }

    // inside of "notes", create a file named ".env"
    const envFile = path.join(notesDir, '.env')
    await fs.promises.writeFile(envFile, '')

    await runCommand(
      CreateCommand('curl -o .env https://raw.githubusercontent.com/standardnotes/server/main/.env.sample'),
      notesDir,
    )

    await runCommand(
      CreateCommand(
        'curl -o localstack_bootstrap.sh https://raw.githubusercontent.com/standardnotes/server/main/docker/localstack_bootstrap.sh',
      ),
      notesDir,
    )

    await runCommand(CreateCommand('chmod +x localstack_bootstrap.sh'), notesDir)

    await runCommand(
      CreateCommand(
        'curl -o docker-compose.yml https://raw.githubusercontent.com/standardnotes/server/main/docker-compose.example.yml',
      ),
      notesDir,
    )

    await runCommand(CreateCommand('docker compose pull'), notesDir)
    await runCommand(CreateCommand('docker compose up -d'), notesDir)
  }

  getDocumentsDir() {
    // Get the user's home directory
    const homeDir = os.homedir()

    // Determine the Documents directory location based on the operating system
    let documentsDir
    if (process.platform === 'win32') {
      documentsDir = path.join(homeDir, 'Documents')
    } else if (process.platform === 'darwin') {
      documentsDir = path.join(homeDir, 'Documents')
    } else {
      documentsDir = path.join(homeDir, 'Documents')
    }

    return documentsDir
  }
}
