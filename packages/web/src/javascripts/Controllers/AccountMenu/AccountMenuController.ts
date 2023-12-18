import { destroyAllObjectProperties } from '@/Utils'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import {
  ApplicationEvent,
  ContentType,
  GetHost,
  InternalEventBusInterface,
  InternalEventHandlerInterface,
  InternalEventInterface,
  ItemManagerInterface,
  SNNote,
  SNTag,
} from '@standardnotes/snjs'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'
import { AbstractViewController } from '../Abstract/AbstractViewController'

export class AccountMenuController extends AbstractViewController implements InternalEventHandlerInterface {
  show = false
  signingOut = false
  otherSessionsSignOut = false
  server: string | undefined = undefined
  notesAndTags: (SNNote | SNTag)[] = []
  isEncryptionEnabled = false
  encryptionStatusString = ''
  isBackupEncrypted = false
  showSignIn = false
  deletingAccount = false
  showRegister = false
  currentPane = AccountMenuPane.GeneralMenu

  override deinit() {
    super.deinit()
    ;(this.notesAndTags as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(
    private items: ItemManagerInterface,
    private _getHost: GetHost,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      show: observable,
      signingOut: observable,
      otherSessionsSignOut: observable,
      server: observable,
      notesAndTags: observable,
      isEncryptionEnabled: observable,
      encryptionStatusString: observable,
      isBackupEncrypted: observable,
      showSignIn: observable,
      deletingAccount: observable,
      showRegister: observable,
      currentPane: observable,

      setShow: action,
      toggleShow: action,
      setSigningOut: action,
      setIsEncryptionEnabled: action,
      setEncryptionStatusString: action,
      setIsBackupEncrypted: action,
      setOtherSessionsSignOut: action,
      setCurrentPane: action,
      setServer: action,
      setDeletingAccount: action,

      notesAndTagsCount: computed,
    })

    eventBus.addEventHandler(this, ApplicationEvent.Launched)

    this.disposers.push(
      this.items.streamItems([ContentType.TYPES.Note, ContentType.TYPES.Tag], () => {
        runInAction(() => {
          this.notesAndTags = this.items.getItems([ContentType.TYPES.Note, ContentType.TYPES.Tag])
        })
      }),
    )
  }
  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case ApplicationEvent.Launched: {
        runInAction(() => {
          this.setServer(this._getHost.execute().getValue())
        })
        break
      }
    }
  }

  setShow = (show: boolean): void => {
    this.show = show
    if (show) {
      this.setCurrentPane(AccountMenuPane.GeneralMenu)
    }
  }

  closeAccountMenu = (): void => {
    this.setShow(false)
  }

  setSigningOut = (signingOut: boolean): void => {
    this.signingOut = signingOut
  }

  setServer = (server: string | undefined): void => {
    this.server = server
  }

  setIsEncryptionEnabled = (isEncryptionEnabled: boolean): void => {
    this.isEncryptionEnabled = isEncryptionEnabled
  }

  setEncryptionStatusString = (encryptionStatusString: string): void => {
    this.encryptionStatusString = encryptionStatusString
  }

  setIsBackupEncrypted = (isBackupEncrypted: boolean): void => {
    this.isBackupEncrypted = isBackupEncrypted
  }

  setShowSignIn = (showSignIn: boolean): void => {
    this.showSignIn = showSignIn
  }

  setShowRegister = (showRegister: boolean): void => {
    this.showRegister = showRegister
  }

  toggleShow = (): void => {
    if (this.show) {
      this.closeAccountMenu()
    } else {
      this.setShow(true)
    }
  }

  setOtherSessionsSignOut = (otherSessionsSignOut: boolean): void => {
    this.otherSessionsSignOut = otherSessionsSignOut
  }

  setCurrentPane = (pane: AccountMenuPane): void => {
    this.currentPane = pane
  }

  setDeletingAccount = (deletingAccount: boolean): void => {
    this.deletingAccount = deletingAccount
  }

  get notesAndTagsCount(): number {
    return this.notesAndTags.length
  }
}
