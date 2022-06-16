import { destroyAllObjectProperties, isDev } from '@/Utils'
import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { ApplicationEvent, ContentType, InternalEventBus, SNNote, SNTag } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import { AccountMenuPane } from '@/Components/AccountMenu/AccountMenuPane'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { StructuredItemsCount } from './StructuredItemsCount'

export class AccountMenuController extends AbstractViewController {
  show = false
  signingOut = false
  otherSessionsSignOut = false
  server: string | undefined = undefined
  enableServerOption = false
  notesAndTags: (SNNote | SNTag)[] = []
  isEncryptionEnabled = false
  encryptionStatusString = ''
  isBackupEncrypted = false
  showSignIn = false
  showRegister = false
  shouldAnimateCloseMenu = false
  currentPane = AccountMenuPane.GeneralMenu

  override deinit() {
    super.deinit()
    ;(this.notesAndTags as unknown) = undefined

    destroyAllObjectProperties(this)
  }

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      show: observable,
      signingOut: observable,
      otherSessionsSignOut: observable,
      server: observable,
      enableServerOption: observable,
      notesAndTags: observable,
      isEncryptionEnabled: observable,
      encryptionStatusString: observable,
      isBackupEncrypted: observable,
      showSignIn: observable,
      showRegister: observable,
      currentPane: observable,
      shouldAnimateCloseMenu: observable,

      setShow: action,
      setShouldAnimateClose: action,
      toggleShow: action,
      setSigningOut: action,
      setIsEncryptionEnabled: action,
      setEncryptionStatusString: action,
      setIsBackupEncrypted: action,
      setOtherSessionsSignOut: action,
      setCurrentPane: action,
      setEnableServerOption: action,
      setServer: action,

      notesAndTagsCount: computed,
    })

    this.disposers.push(
      this.application.addEventObserver(async () => {
        runInAction(() => {
          if (isDev && window.devAccountServer) {
            this.setServer(window.devAccountServer)
            this.application.setCustomHost(window.devAccountServer).catch(console.error)
          } else {
            this.setServer(this.application.getHost())
          }
        })
      }, ApplicationEvent.Launched),
    )

    this.disposers.push(
      this.application.streamItems([ContentType.Note, ContentType.Tag], () => {
        runInAction(() => {
          this.notesAndTags = this.application.items.getItems([ContentType.Note, ContentType.Tag])
        })
      }),
    )
  }

  setShow = (show: boolean): void => {
    this.show = show
  }

  setShouldAnimateClose = (shouldAnimateCloseMenu: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimateCloseMenu
  }

  closeAccountMenu = (): void => {
    this.setShouldAnimateClose(true)
    setTimeout(() => {
      this.setShow(false)
      this.setShouldAnimateClose(false)
      this.setCurrentPane(AccountMenuPane.GeneralMenu)
    }, 150)
  }

  setSigningOut = (signingOut: boolean): void => {
    this.signingOut = signingOut
  }

  setServer = (server: string | undefined): void => {
    this.server = server
  }

  setEnableServerOption = (enableServerOption: boolean): void => {
    this.enableServerOption = enableServerOption
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

  get notesAndTagsCount(): number {
    return this.notesAndTags.length
  }

  get structuredNotesAndTagsCount(): StructuredItemsCount {
    const count: StructuredItemsCount = {
      notes: 0,
      archived: 0,
      deleted: 0,
      tags: 0,
    }
    for (const item of this.notesAndTags) {
      if (item.archived) {
        count.archived++
      }

      if (item.trashed) {
        count.deleted++
      }

      if (item.content_type === ContentType.Note) {
        count.notes++
      }

      if (item.content_type === ContentType.Tag) {
        count.tags++
      }
    }
    return count
  }
}
