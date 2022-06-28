import { WebApplication } from '@/Application/Application'
import { WebAppEvent } from '@/Application/WebAppEvent'
import { ApplicationGroup } from '@/Application/ApplicationGroup'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { destroyAllObjectProperties, preventRefreshing } from '@/Utils'
import { ApplicationEvent, ApplicationDescriptor } from '@standardnotes/snjs'
import {
  STRING_NEW_UPDATE_READY,
  STRING_CONFIRM_APP_QUIT_DURING_UPGRADE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT,
  STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE,
  STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON,
} from '@/Constants/Strings'
import { alertDialog, confirmDialog } from '@/Services/AlertService'
import AccountMenu from '@/Components/AccountMenu/AccountMenu'
import Icon from '@/Components/Icon/Icon'
import QuickSettingsMenu from '@/Components/QuickSettingsMenu/QuickSettingsMenu'
import SyncResolutionMenu from '@/Components/SyncResolutionMenu/SyncResolutionMenu'
import { Fragment } from 'react'
import { AccountMenuPane } from '../AccountMenu/AccountMenuPane'
import { EditorEventSource } from '@/Types/EditorEventSource'

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

class Footer extends PureComponent<Props, State> {
  public user?: unknown
  private didCheckForOffline = false
  private completedInitialSync = false
  private showingDownloadStatus = false
  private webEventListenerDestroyer: () => void
  private removeStatusObserver!: () => void

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

    this.webEventListenerDestroyer = props.application.addWebEventObserver((event, data) => {
      const statusService = this.application.status

      switch (event) {
        case WebAppEvent.NewUpdateAvailable:
          this.onNewUpdateAvailable()
          break
        case WebAppEvent.EditorFocused:
          if ((data as any).eventSource === EditorEventSource.UserInteraction) {
            this.closeAccountMenu()
          }
          break
        case WebAppEvent.BeganBackupDownload:
          statusService.setMessage('Saving local backup…')
          break
        case WebAppEvent.EndedBackupDownload: {
          const successMessage = 'Successfully saved backup.'
          const errorMessage = 'Unable to save local backup.'
          statusService.setMessage((data as any).success ? successMessage : errorMessage)

          const twoSeconds = 2000
          setTimeout(() => {
            if (statusService.message === successMessage || statusService.message === errorMessage) {
              statusService.setMessage('')
            }
          }, twoSeconds)
          break
        }
      }
    })
  }

  override deinit() {
    this.removeStatusObserver()
    ;(this.removeStatusObserver as unknown) = undefined

    this.webEventListenerDestroyer()
    ;(this.webEventListenerDestroyer as unknown) = undefined

    super.deinit()

    destroyAllObjectProperties(this)
  }

  override componentDidMount(): void {
    super.componentDidMount()

    this.removeStatusObserver = this.application.status.addEventObserver((_event, message) => {
      this.setState({
        arbitraryStatusMessage: message,
      })
    })

    this.autorun(() => {
      const showBetaWarning = this.viewControllerManager.showBetaWarning
      this.setState({
        showBetaWarning: showBetaWarning,
        showAccountMenu: this.viewControllerManager.accountMenuController.show,
        showQuickSettingsMenu: this.viewControllerManager.quickSettingsMenuController.open,
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
          this.application.status.setMessage('')
          this.completedInitialSync = true
        }
        if (!this.didCheckForOffline) {
          this.didCheckForOffline = true
          if (this.state.offline && this.application.items.getNoteCount() === 0) {
            this.viewControllerManager.accountMenuController.setShow(true)
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
          this.application.status.setMessage('Syncing…')
        }
        break
    }
  }

  updateSyncStatus() {
    const statusManager = this.application.status
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

      statusManager.setMessage(`Syncing ${stats.uploadTotalCount} items (${stringPercentage} complete)`)
    } else {
      statusManager.setMessage('')
    }
  }

  updateLocalDataStatus() {
    const statusManager = this.application.status
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
    this.viewControllerManager.quickSettingsMenuController.closeQuickSettingsMenu()
    this.viewControllerManager.accountMenuController.toggleShow()
  }

  quickSettingsClickHandler = () => {
    this.viewControllerManager.accountMenuController.closeAccountMenu()
    this.viewControllerManager.quickSettingsMenuController.toggle()
  }

  syncResolutionClickHandler = () => {
    this.setState({
      showSyncResolution: !this.state.showSyncResolution,
    })
  }

  closeAccountMenu = () => {
    this.viewControllerManager.accountMenuController.setShow(false)
    this.viewControllerManager.accountMenuController.setCurrentPane(AccountMenuPane.GeneralMenu)
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
      text: 'If you wish to go back to a stable version, make sure to sign out ' + 'of this beta app first.',
    }).catch(console.error)
  }

  clickOutsideAccountMenu = () => {
    this.viewControllerManager.accountMenuController.closeAccountMenu()
  }

  clickOutsideQuickSettingsMenu = () => {
    this.viewControllerManager.quickSettingsMenuController.closeQuickSettingsMenu()
  }

  override render() {
    return (
      <div className="sn-component">
        <div
          id="footer-bar"
          className="z-footer-bar flex h-6 w-full select-none items-center justify-between border-t border-border bg-contrast px-3 text-text"
        >
          <div className="left flex h-full">
            <div className="sk-app-bar-item relative z-footer-bar-item ml-0 select-none">
              <div
                onClick={this.accountMenuClickHandler}
                className={
                  (this.state.showAccountMenu ? 'bg-border' : '') +
                  ' flex h-full w-8 cursor-pointer items-center justify-center rounded-full'
                }
              >
                <div
                  className={
                    this.state.hasError ? 'text-danger' : (this.user ? 'text-info' : 'text-neutral') + ' h-5 w-5'
                  }
                >
                  <Icon type="account-circle" className="max-h-5 hover:text-info" />
                </div>
              </div>
              {this.state.showAccountMenu && (
                <AccountMenu
                  onClickOutside={this.clickOutsideAccountMenu}
                  viewControllerManager={this.viewControllerManager}
                  application={this.application}
                  mainApplicationGroup={this.props.applicationGroup}
                />
              )}
            </div>
            <div className="sk-app-bar-item ml-0-important relative z-footer-bar-item select-none">
              <div
                onClick={this.quickSettingsClickHandler}
                className="flex h-full w-8 cursor-pointer items-center justify-center"
              >
                <div className="h-5">
                  <Icon
                    type="tune"
                    className={(this.state.showQuickSettingsMenu ? 'text-info' : '') + ' rounded hover:text-info'}
                  />
                </div>
              </div>
              {this.state.showQuickSettingsMenu && (
                <QuickSettingsMenu
                  onClickOutside={this.clickOutsideQuickSettingsMenu}
                  viewControllerManager={this.viewControllerManager}
                  application={this.application}
                />
              )}
            </div>
            {this.state.showBetaWarning && (
              <Fragment>
                <div className="relative z-footer-bar-item ml-3 flex select-none items-center border-l border-solid border-border pl-3">
                  <a onClick={this.betaMessageClickHandler} className="no-decoration title text-xs font-bold">
                    You are using a beta version of the app
                  </a>
                </div>
              </Fragment>
            )}
          </div>
          <div className="center">
            {this.state.arbitraryStatusMessage && (
              <div className="relative z-footer-bar-item flex select-none items-center text-xs font-bold text-neutral">
                {this.state.arbitraryStatusMessage}
              </div>
            )}
          </div>
          <div className="right flex h-full">
            {this.state.dataUpgradeAvailable && (
              <div
                onClick={this.securityUpdateClickHandler}
                className="relative z-footer-bar-item flex select-none items-center text-xs font-bold text-success"
              >
                Encryption upgrade available.
              </div>
            )}
            {this.state.newUpdateAvailable && (
              <div
                onClick={this.newUpdateClickHandler}
                className="relative z-footer-bar-item ml-3 flex select-none items-center text-xs font-bold text-info"
              >
                New update available.
              </div>
            )}
            {(this.state.outOfSync || this.state.showSyncResolution) && (
              <div className="relative z-footer-bar-item ml-3 flex select-none items-center">
                {this.state.outOfSync && (
                  <div onClick={this.syncResolutionClickHandler} className="text-xs font-bold text-warning">
                    Potentially Out of Sync
                  </div>
                )}
                {this.state.showSyncResolution && (
                  <SyncResolutionMenu close={this.syncResolutionClickHandler} application={this.application} />
                )}
              </div>
            )}
            {this.state.offline && (
              <div className="relative z-footer-bar-item ml-3 flex select-none items-center text-xs font-bold">
                Offline
              </div>
            )}
            {this.state.hasPasscode && (
              <div
                id="lock-item"
                onClick={this.lockClickHandler}
                title="Locks application and wipes unencrypted data from memory."
                className="relative z-footer-bar-item ml-3 flex cursor-pointer select-none items-center border-l border-solid border-border pl-2 hover:text-info"
              >
                <Icon type="lock-filled" size="custom" className="h-4.5 w-4.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Footer
