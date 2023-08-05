import { InternalEventBusInterface } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'

export class QuickSettingsController extends AbstractViewController {
  open = false
  shouldAnimateCloseMenu = false

  constructor(eventBus: InternalEventBusInterface) {
    super(eventBus)

    makeObservable(this, {
      open: observable,
      shouldAnimateCloseMenu: observable,

      setOpen: action,
      setShouldAnimateCloseMenu: action,
      toggle: action,
      closeQuickSettingsMenu: action,
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
      this.closeQuickSettingsMenu()
    } else {
      this.setOpen(true)
    }
  }

  closeQuickSettingsMenu = (): void => {
    this.setShouldAnimateCloseMenu(true)
    setTimeout(() => {
      this.setOpen(false)
      this.setShouldAnimateCloseMenu(false)
    }, 150)
  }
}
