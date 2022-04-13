import { WebAppEvent, WebApplication } from '@/UIModels/Application'
import { ApplicationGroup } from '@/UIModels/ApplicationGroup'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { preventRefreshing } from '@/Utils'
import {
  ApplicationEvent,
  ContentType,
  CollectionSort,
  ApplicationDescriptor,
} from '@standardnotes/snjs'
import {
  STRING_NEW_UPDATE_READY,
  STRING_CONFIRM_APP_QUIT_DURING_UPGRADE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
} from '@/Strings'
import { alertDialog, confirmDialog } from '@/Services/AlertService'
import { AccountMenu, AccountMenuPane } from '@/Components/AccountMenu'
import { AppStateEvent, EventSource } from '@/UIModels/AppState'
import { Icon } from '@/Components/Icon'
import { QuickSettingsMenu } from '@/Components/QuickSettingsMenu'
import { SyncResolutionMenu } from '@/Components/SyncResolutionMenu'
import { Fragment } from 'preact'

type Props = {
  application: WebApplication
  applicationGroup: ApplicationGroup
}

type State = {
  outOfSync: boolean
  dataUpgradeAvailable: boolean
  hasPasscode: boolean
  descriptors: ApplicationDescriptor[]
  showBetaWarning: boolean
  showSyncResolution: boolean
  newUpdateAvailable: boolean
  showAccountMenu: boolean
  showQuickSettingsMenu: boolean
  offline: boolean
  hasError: boolean
  arbitraryStatusMessage?: string
}

export class Footer extends PureComponent<Props, State> {
  public user?: unknown
  private didCheckForOffline = false
  private completedInitialSync = false
  private showingDownloadStatus = false
  private webEventListenerDestroyer: () => void

  constructor(props: Props) {
    super(props, props.application)
    this.state = {
      hasError: false,
      offline: true,
      outOfSync: false,
      dataUpgradeAvailable: false,
      hasPasscode: false,
      descriptors: props.applicationGroup.getDescriptors(),
      showBetaWarning: false,
      showSyncResolution: false,
      newUpdateAvailable: false,
      showAccountMenu: false,
      showQuickSettingsMenu: false,
    }

    this.webEventListenerDestroyer = props.application.addWebEventObserver((event) => {
      if (event === WebAppEvent.NewUpdateAvailable) {
        this.onNewUpdateAvailable()
      }
    })
  }

  override deinit() {
    this.webEventListenerDestroyer()
    ;(this.webEventListenerDestroyer as unknown) = undefined
    super.deinit()
  }

  override componentDidMount(): void {
    super.componentDidMount()
    this.application.getStatusManager().onStatusChange((message) => {
      this.setState({
        arbitraryStatusMessage: message,
      })
    })
    this.autorun(() => {
      const showBetaWarning = this.appState.showBetaWarning
      this.setState({
        showBetaWarning: showBetaWarning,
        showAccountMenu: this.appState.accountMenu.show,
        showQuickSettingsMenu: this.appState.quickSettingsMenu.open,
      })
    })
  }

  reloadUpgradeStatus() {
    this.application
      .checkForSecurityUpdate()
      .then((available) => {
        this.setState({
          dataUpgradeAvailable: available,
        })
      })
      .catch(console.error)
  }

  override async onAppLaunch() {
    super.onAppLaunch().catch(console.error)
    this.reloadPasscodeStatus().catch(console.error)
    this.reloadUser()
    this.reloadUpgradeStatus()
    this.updateOfflineStatus()
    this.findErrors()
    this.streamItems()
  }

  reloadUser() {
    this.user = this.application.getUser()
  }

  async reloadPasscodeStatus() {
    const hasPasscode = this.application.hasPasscode()
    this.setState({
      hasPasscode: hasPasscode,
    })
  }

  override onAppStateEvent(eventName: AppStateEvent, data: any) {
    const statusService = this.application.getStatusManager()
    switch (eventName) {
      case AppStateEvent.EditorFocused:
        if (data.eventSource === EventSource.UserInteraction) {
          this.closeAccountMenu()
        }
        break
      case AppStateEvent.BeganBackupDownload:
        statusService.setMessage('Saving local backup…')
        break
      case AppStateEvent.EndedBackupDownload: {
        const successMessage = 'Successfully saved backup.'
        const errorMessage = 'Unable to save local backup.'
        statusService.setMessage(data.success ? successMessage : errorMessage)

        const twoSeconds = 2000
        setTimeout(() => {
          if (statusService.message === successMessage || statusService.message === errorMessage) {
            statusService.setMessage('')
          }
        }, twoSeconds)
        break
      }
    }
  }

  override async onAppKeyChange() {
    super.onAppKeyChange().catch(console.error)
    this.reloadPasscodeStatus().catch(console.error)
  }

  override onAppEvent(eventName: ApplicationEvent) {
    switch (eventName) {
      case ApplicationEvent.KeyStatusChanged:
        this.reloadUpgradeStatus()
        break
      case ApplicationEvent.EnteredOutOfSync:
        this.setState({
          outOfSync: true,
        })
        break
      case ApplicationEvent.ExitedOutOfSync:
        this.setState({
          outOfSync: false,
        })
        break
      case ApplicationEvent.CompletedFullSync:
        if (!this.completedInitialSync) {
          this.application.getStatusManager().setMessage('')
          this.completedInitialSync = true
        }
        if (!this.didCheckForOffline) {
          this.didCheckForOffline = true
          if (this.state.offline && this.application.items.getNoteCount() === 0) {
            this.appState.accountMenu.setShow(true)
          }
        }
        this.findErrors()
        this.updateOfflineStatus()
        break
      case ApplicationEvent.SyncStatusChanged:
        this.updateSyncStatus()
        break
      case ApplicationEvent.FailedSync:
        this.updateSyncStatus()
        this.findErrors()
        this.updateOfflineStatus()
        break
      case ApplicationEvent.LocalDataIncrementalLoad:
      case ApplicationEvent.LocalDataLoaded:
        this.updateLocalDataStatus()
        break
      case ApplicationEvent.SignedIn:
      case ApplicationEvent.SignedOut:
        this.reloadUser()
        break
      case ApplicationEvent.WillSync:
        if (!this.completedInitialSync) {
          this.application.getStatusManager().setMessage('Syncing…')
        }
        break
    }
  }

  streamItems() {
    this.application.items.setDisplayOptions(ContentType.Theme, CollectionSort.Title, 'asc')
  }

  updateSyncStatus() {
    const statusManager = this.application.getStatusManager()
    const syncStatus = this.application.sync.getSyncStatus()
    const stats = syncStatus.getStats()
    if (syncStatus.hasError()) {
      statusManager.setMessage('Unable to Sync')
    } else if (stats.downloadCount > 20) {
      const text = `Downloading ${stats.downloadCount} items. Keep app open.`
      statusManager.setMessage(text)
      this.showingDownloadStatus = true
    } else if (this.showingDownloadStatus) {
      this.showingDownloadStatus = false
      statusManager.setMessage('Download Complete.')
      setTimeout(() => {
        statusManager.setMessage('')
      }, 2000)
    } else if (stats.uploadTotalCount > 20) {
      const completionPercentage =
        stats.uploadCompletionCount === 0 ? 0 : stats.uploadCompletionCount / stats.uploadTotalCount

      const stringPercentage = completionPercentage.toLocaleString(undefined, {
        style: 'percent',
      })

      statusManager.setMessage(
        `Syncing ${stats.uploadTotalCount} items (${stringPercentage} complete)`,
      )
    } else {
      statusManager.setMessage('')
    }
  }

  updateLocalDataStatus() {
    const statusManager = this.application.getStatusManager()
    const syncStatus = this.application.sync.getSyncStatus()
    const stats = syncStatus.getStats()
    const encryption = this.application.isEncryptionAvailable()
    if (stats.localDataDone) {
      statusManager.setMessage('')
      return
    }
    const notesString = `${stats.localDataCurrent}/${stats.localDataTotal} items...`
    const loadingStatus = encryption ? `Decrypting ${notesString}` : `Loading ${notesString}`
    statusManager.setMessage(loadingStatus)
  }

  updateOfflineStatus() {
    this.setState({
      offline: this.application.noAccount(),
    })
  }

  findErrors() {
    this.setState({
      hasError: this.application.sync.getSyncStatus().hasError(),
    })
  }

  securityUpdateClickHandler = async () => {
    if (
      await confirmDialog({
        title: STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
        text: STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
        confirmButtonText: STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
      })
    ) {
      preventRefreshing(STRING_CONFIRM_APP_QUIT_DURING_UPGRADE, async () => {
        await this.application.upgradeProtocolVersion()
      }).catch(console.error)
    }
  }

  accountMenuClickHandler = () => {
    this.appState.quickSettingsMenu.closeQuickSettingsMenu()
    this.appState.accountMenu.toggleShow()
  }

  quickSettingsClickHandler = () => {
    this.appState.accountMenu.closeAccountMenu()
    this.appState.quickSettingsMenu.toggle()
  }

  syncResolutionClickHandler = () => {
    this.setState({
      showSyncResolution: !this.state.showSyncResolution,
    })
  }

  closeAccountMenu = () => {
    this.appState.accountMenu.setShow(false)
    this.appState.accountMenu.setCurrentPane(AccountMenuPane.GeneralMenu)
  }

  lockClickHandler = () => {
    this.application.lock().catch(console.error)
  }

  onNewUpdateAvailable = () => {
    this.setState({
      newUpdateAvailable: true,
    })
  }

  newUpdateClickHandler = () => {
    this.setState({
      newUpdateAvailable: false,
    })
    this.application.alertService.alert(STRING_NEW_UPDATE_READY).catch(console.error)
  }

  betaMessageClickHandler = () => {
    alertDialog({
      title: 'You are using a beta version of the app',
      text:
        'If you wish to go back to a stable version, make sure to sign out ' +
        'of this beta app first.',
    }).catch(console.error)
  }

  clickOutsideAccountMenu = () => {
    this.appState.accountMenu.closeAccountMenu()
  }

  clickOutsideQuickSettingsMenu = () => {
    this.appState.quickSettingsMenu.closeQuickSettingsMenu()
  }

  override render() {
    return (
      <div className="sn-component">
        <div id="footer-bar" className="sk-app-bar no-edges no-bottom-edge">
          <div className="left">
            <div className="sk-app-bar-item ml-0">
              <div
                onClick={this.accountMenuClickHandler}
                className={
                  (this.state.showAccountMenu ? 'bg-border' : '') +
                  ' w-8 h-full flex items-center justify-center cursor-pointer rounded-full'
                }
              >
                <div
                  className={
                    this.state.hasError ? 'danger' : (this.user ? 'info' : 'neutral') + ' w-5 h-5'
                  }
                >
                  <Icon type="account-circle" className="hover:color-info w-5 h-5 max-h-5" />
                </div>
              </div>
              {this.state.showAccountMenu && (
                <AccountMenu
                  onClickOutside={this.clickOutsideAccountMenu}
                  appState={this.appState}
                  application={this.application}
                  mainApplicationGroup={this.props.applicationGroup}
                />
              )}
            </div>
            <div className="sk-app-bar-item ml-0-important">
              <div
                onClick={this.quickSettingsClickHandler}
                className="w-8 h-full flex items-center justify-center cursor-pointer"
              >
                <div className="h-5">
                  <Icon
                    type="tune"
                    className={
                      (this.state.showQuickSettingsMenu ? 'color-info' : '') +
                      ' rounded hover:color-info'
                    }
                  />
                </div>
              </div>
              {this.state.showQuickSettingsMenu && (
                <QuickSettingsMenu
                  onClickOutside={this.clickOutsideQuickSettingsMenu}
                  appState={this.appState}
                  application={this.application}
                />
              )}
            </div>
            {this.state.showBetaWarning && (
              <Fragment>
                <div className="sk-app-bar-item border" />
                <div className="sk-app-bar-item">
                  <a
                    onClick={this.betaMessageClickHandler}
                    className="no-decoration sk-label title"
                  >
                    You are using a beta version of the app
                  </a>
                </div>
              </Fragment>
            )}
          </div>
          <div className="center">
            {this.state.arbitraryStatusMessage && (
              <div className="sk-app-bar-item">
                <div className="sk-app-bar-item-column">
                  <span className="neutral sk-label">{this.state.arbitraryStatusMessage}</span>
                </div>
              </div>
            )}
          </div>
          <div className="right">
            {this.state.dataUpgradeAvailable && (
              <div onClick={this.securityUpdateClickHandler} className="sk-app-bar-item">
                <span className="success sk-label">Encryption upgrade available.</span>
              </div>
            )}
            {this.state.newUpdateAvailable && (
              <div onClick={this.newUpdateClickHandler} className="sk-app-bar-item">
                <span className="info sk-label">New update available.</span>
              </div>
            )}
            {(this.state.outOfSync || this.state.showSyncResolution) && (
              <div className="sk-app-bar-item">
                {this.state.outOfSync && (
                  <div onClick={this.syncResolutionClickHandler} className="sk-label warning">
                    Potentially Out of Sync
                  </div>
                )}
                {this.state.showSyncResolution && (
                  <SyncResolutionMenu
                    close={this.syncResolutionClickHandler}
                    application={this.application}
                  />
                )}
              </div>
            )}
            {this.state.offline && (
              <div className="sk-app-bar-item">
                <div className="sk-label">Offline</div>
              </div>
            )}
            {this.state.hasPasscode && (
              <Fragment>
                <div className="sk-app-bar-item border" />
                <div
                  id="lock-item"
                  onClick={this.lockClickHandler}
                  title="Locks application and wipes unencrypted data from memory."
                  className="sk-app-bar-item"
                >
                  <div className="sk-label">
                    <i id="footer-lock-icon" className="icon ion-locked" />
                  </div>
                </div>
              </Fragment>
            )}
          </div>
        </div>
      </div>
    )
  }
}
