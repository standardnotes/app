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
  private logs: string[] = []

  private readonly LOGS_BUFFER_SIZE = 1000

  constructor(private homeServer: HomeServerInterface, private webContents: WebContents) {}

  async isHomeServerRunning(): Promise<boolean> {
    const status = await this.homeServerStatus()

    return status.status === 'on'
  }

  async activatePremiumFeatures(username: string): Promise<string | null> {
    const result = await this.homeServer.activatePremiumFeatures(username)

    if (result.isFailed()) {
      return result.getError()
    }

    return null
  }

  getHomeServerConfiguration(): HomeServerEnvironmentConfiguration | undefined {
    return this.homeServerConfiguration
  }

  async setHomeServerConfiguration(configurationJSONString: string): Promise<void> {
    try {
      this.homeServerConfiguration = JSON.parse(configurationJSONString)

      this.webContents.send(MessageToWebApp.HomeServerConfigurationChanged, configurationJSONString)
    } catch (error) {
      console.error(`Could not parse home server configuration: ${(error as Error).message}`)
    }
  }

  async setHomeServerDataLocation(location: string): Promise<void> {
    this.homeServerDataLocation = location
  }

  async stopHomeServer(): Promise<void> {
    await this.homeServer.stop()
  }

  async restartHomeServer(): Promise<void> {
    await this.stopHomeServer()
    await this.startHomeServer()
  }

  async homeServerStatus(): Promise<HomeServerStatus> {
    const isHomeServerRunning = await this.homeServer.isRunning()

    if (!isHomeServerRunning) {
      return { status: 'off' }
    }

    return {
      status: 'on',
      url: this.getServerUrl(),
    }
  }

  async startHomeServer(): Promise<void> {
    try {
      this.lastError = undefined
      this.logs = []

      if (!this.homeServerConfiguration) {
        await this.setHomeServerConfiguration(JSON.stringify(this.generateHomeServerConfiguration()))
      }

      if (!this.homeServerDataLocation) {
        return
      }

      const {
        jwtSecret,
        authJwtSecret,
        encryptionServerKey,
        pseudoKeyParamsKey,
        valetTokenSecret,
        port,
        logLevel,
        databaseEngine,
        mysqlConfiguration,
      } = this.homeServerConfiguration as HomeServerEnvironmentConfiguration

      const environment: { [name: string]: string } = {
        JWT_SECRET: jwtSecret,
        AUTH_JWT_SECRET: authJwtSecret,
        ENCRYPTION_SERVER_KEY: encryptionServerKey,
        PSEUDO_KEY_PARAMS_KEY: pseudoKeyParamsKey,
        VALET_TOKEN_SECRET: valetTokenSecret,
        FILES_SERVER_URL: this.getServerUrl(),
        LOG_LEVEL: logLevel ?? 'info',
        VERSION: 'desktop',
        PORT: port.toString(),
        DB_TYPE: databaseEngine,
      }

      if (mysqlConfiguration !== undefined) {
        environment.DB_HOST = mysqlConfiguration.host
        if (mysqlConfiguration.port) {
          environment.DB_PORT = mysqlConfiguration.port.toString()
        }
        environment.DB_USERNAME = mysqlConfiguration.username
        environment.DB_PASSWORD = mysqlConfiguration.password
        environment.DB_DATABASE = mysqlConfiguration.database
      }

      await this.homeServer.start({
        dataDirectoryPath: this.homeServerDataLocation,
        environment,
      })

      this.webContents.send(MessageToWebApp.HomeServerStarted, this.getServerUrl())

      const logStream = this.homeServer.logs()
      logStream.on('data', this.appendLogs.bind(this))
    } catch (error) {
      console.error(`Could not start home server: ${(error as Error).message}`)

      this.lastError = error as Error
    }
  }

  async getHomeServerLogs(): Promise<string[]> {
    return this.logs
  }

  private appendLogs(log: Uint8Array): void {
    this.logs.push(new TextDecoder().decode(log))

    if (this.logs.length > this.LOGS_BUFFER_SIZE) {
      this.logs.shift()
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
      databaseEngine: 'sqlite',
    }

    return configuration
  }

  private getServerUrl(): string {
    return `http://${this.getLocalIP()}:${(this.homeServerConfiguration as HomeServerEnvironmentConfiguration).port}`
  }

  getLastHomeServerErrorMessage(): string | undefined {
    return this.lastError?.message
  }
}
