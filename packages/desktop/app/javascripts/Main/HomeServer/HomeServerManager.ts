import { AppState } from '../../../AppState'
import { HomeServerManagerInterface, HomeServerStatus } from '@web/Application/Device/DesktopSnjsExports'
import { StoreKeys } from '../Store/StoreKeys'
import { HomeServerInterface } from '@standardnotes/home-server'

const os = require('os')

export class HomeServerManager implements HomeServerManagerInterface {
  constructor(private appState: AppState, private homeServer: HomeServerInterface) {}

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

    const url = isHomeServerRunning
      ? `http://${this.getLocalIP()}:${this.appState.store.get(StoreKeys.HomeServerPort)}`
      : undefined

    return { status: isHomeServerRunning ? 'on' : 'off', url }
  }

  async startServer(): Promise<void> {
    const jwtSecret = this.appState.store.get(StoreKeys.HomeServerJWTSecret) ?? this.generateRandomKey(32)
    const authJwtSecret = this.appState.store.get(StoreKeys.HomeServerAuthJWTSecret) ?? this.generateRandomKey(32)
    const encryptionServerKey =
      this.appState.store.get(StoreKeys.HomeServerEncryptionServerKey) ?? this.generateRandomKey(32)
    const pseudoKeyParamsKey =
      this.appState.store.get(StoreKeys.HomeServerPseudoKeyParamsKey) ?? this.generateRandomKey(32)
    const valetTokenSecret = this.appState.store.get(StoreKeys.HomeServerValetTokenSecret) ?? this.generateRandomKey(32)
    const port = this.appState.store.get(StoreKeys.HomeServerPort) ?? 3127

    this.appState.store.set(StoreKeys.HomeServerJWTSecret, jwtSecret)
    this.appState.store.set(StoreKeys.HomeServerAuthJWTSecret, authJwtSecret)
    this.appState.store.set(StoreKeys.HomeServerEncryptionServerKey, encryptionServerKey)
    this.appState.store.set(StoreKeys.HomeServerPseudoKeyParamsKey, pseudoKeyParamsKey)
    this.appState.store.set(StoreKeys.HomeServerValetTokenSecret, valetTokenSecret)
    this.appState.store.set(StoreKeys.HomeServerPort, port)

    await this.homeServer.start({
      environment: {
        JWT_SECRET: jwtSecret,
        AUTH_JWT_SECRET: authJwtSecret,
        ENCRYPTION_SERVER_KEY: encryptionServerKey,
        PSEUDO_KEY_PARAMS_KEY: pseudoKeyParamsKey,
        VALET_TOKEN_SECRET: valetTokenSecret,
        FILES_SERVER_URL: `http://${this.getLocalIP()}:${this.appState.store.get(StoreKeys.HomeServerPort)}`,
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
}
