import { HomeServerManagerInterface, HomeServerStatus } from '@web/Application/Device/DesktopSnjsExports'
import { HomeServerInterface } from '@standardnotes/home-server'
import { WebContents } from 'electron'
import { MessageToWebApp } from '../../Shared/IpcMessages'
import { HomeServerEnvironmentConfiguration } from '@standardnotes/services'

const os = require('os')

export class HomeServerManager implements HomeServerManagerInterface {
  private homeServerConfiguration: HomeServerEnvironmentConfiguration | undefined

  constructor(private homeServer: HomeServerInterface, private webContents: WebContents) {}

  async setHomeServerConfiguration(configurationJSONString: string): Promise<void> {
    try {
      this.homeServerConfiguration = JSON.parse(configurationJSONString)
    } catch (error) {
      console.error(`Could not parse home server configuration: ${(error as Error).message}`)
    }
  }

  listenOnServerLogs(callback: (data: Buffer) => void): void {
    const logStream = this.homeServer.logs()

    logStream.on('data', callback)
  }

  stopListeningOnServerLogs(): void {
    const logStream = this.homeServer.logs()

    logStream.removeAllListeners('data')
  }

  async stopServer(): Promise<void> {
    await this.homeServer.stop()
  }

  async restartServer(): Promise<void> {
    await this.stopServer()
    await this.startServer()
  }

  async serverStatus(): Promise<HomeServerStatus> {
    const isHomeServerRunning = await this.homeServer.isRunning()

    if (!isHomeServerRunning) {
      return { status: 'off' }
    }

    return {
      status: 'on',
      url: `http://${this.getLocalIP()}:${(this.homeServerConfiguration as HomeServerEnvironmentConfiguration).port}`,
    }
  }

  async startServer(): Promise<void> {
    if (!this.homeServerConfiguration) {
      this.homeServerConfiguration = this.generateHomeServerConfiguration()
    }

    const { jwtSecret, authJwtSecret, encryptionServerKey, pseudoKeyParamsKey, valetTokenSecret, port } =
      this.homeServerConfiguration

    await this.homeServer.start({
      environment: {
        JWT_SECRET: jwtSecret,
        AUTH_JWT_SECRET: authJwtSecret,
        ENCRYPTION_SERVER_KEY: encryptionServerKey,
        PSEUDO_KEY_PARAMS_KEY: pseudoKeyParamsKey,
        VALET_TOKEN_SECRET: valetTokenSecret,
        FILES_SERVER_URL: `http://${this.getLocalIP()}:${port}`,
        LOG_LEVEL: 'info',
        VERSION: 'desktop',
        PORT: port.toString(),
      },
    })
  }

  private generateRandomKey(length: number): string {
    return require('crypto').randomBytes(length).toString('hex')
  }

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

  private generateHomeServerConfiguration(): HomeServerEnvironmentConfiguration {
    const jwtSecret = this.generateRandomKey(32)
    const authJwtSecret = this.generateRandomKey(32)
    const encryptionServerKey = this.generateRandomKey(32)
    const pseudoKeyParamsKey = this.generateRandomKey(32)
    const valetTokenSecret = this.generateRandomKey(32)
    const port = 3127

    const configuration: HomeServerEnvironmentConfiguration = {
      jwtSecret,
      authJwtSecret,
      encryptionServerKey,
      pseudoKeyParamsKey,
      valetTokenSecret,
      port,
    }

    this.webContents.send(MessageToWebApp.HomeServerConfigurationChanged, configuration)

    return configuration
  }
}
