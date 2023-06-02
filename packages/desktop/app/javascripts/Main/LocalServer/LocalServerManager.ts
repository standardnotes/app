import { AppState } from './../../../AppState'
import { DesktopServerManagerInterface, DesktopServerStatus } from '@web/Application/Device/DesktopSnjsExports'
import { StoreKeys } from '../Store/StoreKeys'
import { shell } from 'electron'
import { moveDirectory, openDirectoryPicker } from '../Utils/FileUtils'
import { Paths } from '../Types/Paths'
import { CommandService } from './CommandService'
import { HomeServerInterface } from '@standardnotes/home-server'

const path = require('path')
const os = require('os')

const DataDirectoryName = 'notes'

export class LocalServiceManager implements DesktopServerManagerInterface {
  private commandService = new CommandService()

  constructor(private appState: AppState, private homeServer: HomeServerInterface) {}

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

  desktopServerListenOnLogs(callback: (data: Buffer) => void): void {
    const logStream = this.homeServer.logs()

    logStream.on('data', callback)
  }

  desktopServerStopListeningOnLogs(): void {
    const logStream = this.homeServer.logs()

    logStream.removeAllListeners('data')
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
    await this.homeServer.stop()
  }

  async desktopServerRestart(): Promise<void> {
    await this.desktopServerStop()
    await this.desktopServerStart()
  }

  async desktopServerStatus(): Promise<DesktopServerStatus> {
    const isHomeServerRunning = await this.homeServer.isRunning()

    const url = isHomeServerRunning
      ? `http://${this.getLocalIP()}:${this.appState.store.get(StoreKeys.DesktopServerPort)}`
      : undefined

    return { status: isHomeServerRunning ? 'on' : 'off', url }
  }

  private generateRandomKey(length: number): string {
    return require('crypto').randomBytes(length).toString('hex')
  }

  async desktopServerStart(): Promise<void> {
    const jwtSecret = this.appState.store.get(StoreKeys.DesktopServerJWTSecret) ?? this.generateRandomKey(32)
    const authJwtSecret = this.appState.store.get(StoreKeys.DesktopServerAuthJWTSecret) ?? this.generateRandomKey(32)
    const encryptionServerKey =
      this.appState.store.get(StoreKeys.DesktopServerEncryptionServerKey) ?? this.generateRandomKey(32)
    const pseudoKeyParamsKey =
      this.appState.store.get(StoreKeys.DesktopServerPseudoKeyParamsKey) ?? this.generateRandomKey(32)
    const valetTokenSecret =
      this.appState.store.get(StoreKeys.DesktopServerValetTokenSecret) ?? this.generateRandomKey(32)
    const port = this.appState.store.get(StoreKeys.DesktopServerPort) ?? 3000

    this.appState.store.set(StoreKeys.DesktopServerJWTSecret, jwtSecret)
    this.appState.store.set(StoreKeys.DesktopServerAuthJWTSecret, authJwtSecret)
    this.appState.store.set(StoreKeys.DesktopServerEncryptionServerKey, encryptionServerKey)
    this.appState.store.set(StoreKeys.DesktopServerPseudoKeyParamsKey, pseudoKeyParamsKey)
    this.appState.store.set(StoreKeys.DesktopServerValetTokenSecret, valetTokenSecret)
    this.appState.store.set(StoreKeys.DesktopServerPort, port)

    await this.homeServer.start({
      environment: {
        JWT_SECRET: jwtSecret,
        AUTH_JWT_SECRET: authJwtSecret,
        ENCRYPTION_SERVER_KEY: encryptionServerKey,
        PSEUDO_KEY_PARAMS_KEY: pseudoKeyParamsKey,
        VALET_TOKEN_SECRET: valetTokenSecret,
        FILES_SERVER_URL: `http://${this.getLocalIP()}:${this.appState.store.get(StoreKeys.DesktopServerPort)}`,
        LOG_LEVEL: 'info',
        VERSION: 'desktop',
        PORT: port.toString(),
      },
    })
  }

  getDocumentsDir() {
    return Paths.documentsDir
  }
}
