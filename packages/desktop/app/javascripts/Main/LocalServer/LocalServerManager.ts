import { AppState } from './../../../AppState'
import { DesktopServerManagerInterface, DesktopServerStatus } from '@web/Application/Device/DesktopSnjsExports'
import { StoreKeys } from '../Store/StoreKeys'
import { shell } from 'electron'
import { moveDirectory, openDirectoryPicker } from '../Utils/FileUtils'
import { Paths } from '../Types/Paths'
import { CommandService, CreateCommand } from './CommandService'

const path = require('path')
const fs = require('fs')
const os = require('os')

const DataDirectoryName = 'notes'

export class LocalServiceManager implements DesktopServerManagerInterface {
  private commandService = new CommandService()

  constructor(private appState: AppState) {}

  private getLocalIP() {
    const interfaces = os.networkInterfaces()
    for (const interfaceName in interfaces) {
      const addresses = interfaces[interfaceName]
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address
        }
      }
    }
  }

  desktopServerGetLogs(): Promise<string[]> {
    return Promise.resolve(this.commandService.getLogs())
  }

  desktopServerClearLogs(): Promise<void> {
    return Promise.resolve(this.commandService.clearLogs())
  }

  async desktopServerChangeDataDirectory(): Promise<string | undefined> {
    const destination = await openDirectoryPicker()

    if (!destination) {
      return undefined
    }

    const newPath = path.join(destination, DataDirectoryName)

    const oldPath = await this.desktopServerGetDataDirectory()

    if (oldPath) {
      await moveDirectory(oldPath, newPath)
    }

    this.appState.store.set(StoreKeys.DesktopServerDataLocation, newPath)

    return newPath
  }

  desktopServerGetDataDirectory(): Promise<string> {
    const persistedValue = this.appState.store.get(StoreKeys.DesktopServerDataLocation)
    return Promise.resolve(persistedValue ?? this.getDefaultDataDirectory())
  }

  private getDefaultDataDirectory(): string {
    return path.join(this.getDocumentsDir(), DataDirectoryName)
  }

  async desktopServerOpenDataDirectory(): Promise<void> {
    const location = await this.desktopServerGetDataDirectory()

    void shell.openPath(location)
  }

  async desktopServerStop(): Promise<void> {
    const dataDir = await this.desktopServerGetDataDirectory()

    await this.commandService.runCommand(CreateCommand('docker compose down'), dataDir)
  }

  async desktopServerRestart(): Promise<void> {
    const dataDir = await this.desktopServerGetDataDirectory()

    await this.commandService.runCommand(CreateCommand('docker compose down'), dataDir)
    await this.commandService.runCommand(CreateCommand('docker compose up -d'), dataDir)
  }

  async desktopServerStatus(): Promise<DesktopServerStatus> {
    const dataDir = await this.desktopServerGetDataDirectory()

    try {
      const { output } = await this.commandService.runCommand(CreateCommand('docker compose ps'), dataDir)

      const lines = output
        .split('\n')
        .slice(1)
        .map((line) => line.trim().split(/\s+/))

      const serviceStatuses = lines
        .filter((parts) => parts.length > 1)
        .map(([name, _command, _service, status, ports]) => ({ name, status, ports }))

      if (serviceStatuses.length > 0 && serviceStatuses.every((service) => service.status.includes('running'))) {
        const httpService = serviceStatuses.find((service) => service.name === 'server_self_hosted')
        const httpPort = httpService?.ports.split('->')[0].split(':')[1]
        const url = `http://${this.getLocalIP()}:${httpPort}`
        return { status: 'on', url: url }
      } else if (serviceStatuses.some((service) => service.status === 'running')) {
        return { status: 'error', message: output }
      } else {
        return { status: 'off' }
      }
    } catch (e) {
      return { status: 'error', message: (e as Error).message }
    }
  }

  private generateRandomKey(length: number): string {
    return require('crypto').randomBytes(length).toString('hex')
  }

  async desktopServerInstall(): Promise<void> {
    const notesDir = await this.desktopServerGetDataDirectory()
    if (!fs.existsSync(notesDir)) {
      fs.mkdirSync(notesDir)
    }

    await this.commandService.runCommand(
      CreateCommand(
        'curl -o localstack_bootstrap.sh https://raw.githubusercontent.com/standardnotes/server/main/docker/localstack_bootstrap.sh',
      ),
      notesDir,
    )

    await this.commandService.runCommand(CreateCommand('chmod +x localstack_bootstrap.sh'), notesDir)

    await this.commandService.runCommand(
      CreateCommand(
        'curl -o docker-compose.yml https://raw.githubusercontent.com/standardnotes/server/main/docker-compose.example.yml',
      ),
      notesDir,
    )

    const dockerComposeFilePath = path.join(notesDir, 'docker-compose.yml')
    const dockerComposeFileContents = fs.readFileSync(dockerComposeFilePath, 'utf8')

    const dbPassword = this.generateRandomKey(32)
    const updatedDockerComposeFileContents = dockerComposeFileContents.replace(
      /(MYSQL_(ROOT_)?PASSWORD=)(.*)$/gm,
      `$1${dbPassword}`,
    )

    fs.writeFileSync(dockerComposeFilePath, updatedDockerComposeFileContents)

    await this.commandService.runCommand(
      CreateCommand('curl -o .env https://raw.githubusercontent.com/standardnotes/server/main/.env.sample'),
      notesDir,
    )

    const envFilePath = path.join(notesDir, '.env')
    const envFileContents = fs.readFileSync(envFilePath, 'utf8') as string

    const updatedEnvFileContents = envFileContents
      .split('\n')
      .map((line) => {
        const keyMatch = line.match(/^([A-Z_]+)=(.*)$/)
        if (
          keyMatch &&
          ['AUTH_JWT_SECRET', 'AUTH_SERVER_ENCRYPTION_SERVER_KEY', 'VALET_TOKEN_SECRET', 'DB_PASSWORD'].includes(
            keyMatch[1],
          )
        ) {
          if (keyMatch[1] === 'DB_PASSWORD') {
            return `${keyMatch[1]}=${dbPassword}`
          } else {
            const keyLength = 32
            const randomKey = this.generateRandomKey(keyLength)
            return `${keyMatch[1]}=${randomKey}`
          }
        } else {
          return line
        }
      })
      .join('\n')

    fs.writeFileSync(envFilePath, updatedEnvFileContents)
  }

  async desktopServerStart(): Promise<void> {
    const notesDir = await this.desktopServerGetDataDirectory()

    await this.commandService.runCommand(CreateCommand('docker compose pull'), notesDir)
    await this.commandService.runCommand(CreateCommand('docker compose up -d'), notesDir)
  }

  getDocumentsDir() {
    return Paths.documentsDir
  }
}
