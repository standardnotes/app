import { InternalEventBusInterface } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/WebApplication'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class VaultSelectionController extends AbstractViewController {
  open = false
  shouldAnimateCloseMenu = false

  constructor(application: WebApplication, eventBus: InternalEventBusInterface) {
    super(application, eventBus)

    makeObservable(this, {
      open: observable,
      shouldAnimateCloseMenu: observable,

      setOpen: action,
      setShouldAnimateCloseMenu: action,
      toggle: action,
      closeVaultSelectionMenu: action,
    })
  }

  setOpen = (open: boolean): void => {
    this.open = open
  }

  setShouldAnimateCloseMenu = (shouldAnimate: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimate
  }

  toggle = (): void => {
    if (this.open) {
      this.closeVaultSelectionMenu()
    } else {
      this.setOpen(true)
    }
  }

  closeVaultSelectionMenu = (): void => {
    this.setShouldAnimateCloseMenu(true)
    setTimeout(() => {
      this.setOpen(false)
      this.setShouldAnimateCloseMenu(false)
    }, 150)
  }
}
