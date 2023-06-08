import {
  HomeServerManagerInterface,
  HomeServerStatus,
  HomeServerEnvironmentConfiguration,
} from '@web/Application/Device/DesktopSnjsExports'
import { HomeServerInterface } from '@standardnotes/home-server'

import { WebContents } from 'electron'
import { MessageToWebApp } from '../../Shared/IpcMessages'

const os = require('os')

export class HomeServerManager implements HomeServerManagerInterface {
  private homeServerConfiguration: HomeServerEnvironmentConfiguration | undefined
  private homeServerDataLocation: string | undefined
  private lastError: Error | undefined

  constructor(private homeServer: HomeServerInterface, private webContents: WebContents) {}

  getHomeServerConfiguration(): HomeServerEnvironmentConfiguration | undefined {
    return this.homeServerConfiguration
  }

  async setHomeServerConfiguration(configurationJSONString: string): Promise<void> {
    try {
      this.homeServerConfiguration = JSON.parse(configurationJSONString)
    } catch (error) {
      console.error(`Could not parse home server configuration: ${(error as Error).message}`)
    }
  }

  async setHomeServerDataLocation(location: string): Promise<void> {
    this.homeServerDataLocation = location
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
      url: this.getServerUrl(),
    }
  }

  async startServer(): Promise<void> {
    try {
      if (!this.homeServerConfiguration) {
        this.homeServerConfiguration = this.generateHomeServerConfiguration()
      }

      if (!this.homeServerDataLocation) {
        return
      }

      const { jwtSecret, authJwtSecret, encryptionServerKey, pseudoKeyParamsKey, valetTokenSecret, port, logLevel } =
        this.homeServerConfiguration

      await this.homeServer.start({
        dataDirectoryPath: this.homeServerDataLocation,
        environment: {
          JWT_SECRET: jwtSecret,
          AUTH_JWT_SECRET: authJwtSecret,
          ENCRYPTION_SERVER_KEY: encryptionServerKey,
          PSEUDO_KEY_PARAMS_KEY: pseudoKeyParamsKey,
          VALET_TOKEN_SECRET: valetTokenSecret,
          FILES_SERVER_URL: this.getServerUrl(),
          LOG_LEVEL: logLevel ?? 'info',
          VERSION: 'desktop',
          PORT: port.toString(),
        },
      })

      this.webContents.send(MessageToWebApp.HomeServerStarted, this.getServerUrl())

      this.lastError = undefined
    } catch (error) {
      console.error(`Could not start home server: ${(error as Error).message}`)

      this.lastError = error as Error
    }
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

    this.webContents.send(MessageToWebApp.HomeServerConfigurationChanged, JSON.stringify(configuration))

    return configuration
  }

  private getServerUrl(): string {
    return `http://${this.getLocalIP()}:${(this.homeServerConfiguration as HomeServerEnvironmentConfiguration).port}`
  }

  getLastServerErrorMessage(): string | undefined {
    return this.lastError?.message
  }
}
