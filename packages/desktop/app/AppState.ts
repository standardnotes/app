import { Store } from './javascripts/Main/Store/Store'
import { StoreKeys } from './javascripts/Main/Store/StoreKeys'
import { Paths, Urls } from './javascripts/Main/Types/Paths'
import { UpdateState } from './javascripts/Main/UpdateManager'
import { WindowState } from './javascripts/Main/Window'

export class AppState {
  readonly version: string
  readonly store: Store
  readonly startUrl = Urls.indexHtml
  readonly isPrimaryInstance: boolean
  public willQuitApp = false
  public windowState?: WindowState
  public deepLinkUrl?: string
  public readonly updates: UpdateState
  public lastRunVersion: string

  constructor(app: Electron.App) {
    this.version = app.getVersion()
    this.store = new Store(Paths.userDataDir)
    this.isPrimaryInstance = app.requestSingleInstanceLock()

    this.lastRunVersion = this.store.get(StoreKeys.LastRunVersion) || 'unknown'
    this.store.set(StoreKeys.LastRunVersion, this.version)

    this.updates = new UpdateState(this)
  }

  public isRunningVersionForFirstTime(): boolean {
    return this.lastRunVersion !== this.version
  }
}
