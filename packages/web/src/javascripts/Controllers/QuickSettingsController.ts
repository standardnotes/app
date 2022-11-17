import { InternalEventBus } from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { TOGGLE_FOCUS_MODE_COMMAND, EXIT_FOCUS_MODE_COMMAND } from '@standardnotes/ui-services'
import { toggleFocusMode } from '@/Utils/toggleFocusMode'

export class QuickSettingsController extends AbstractViewController {
  open = false
  shouldAnimateCloseMenu = false
  focusModeEnabled = false

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      open: observable,
      shouldAnimateCloseMenu: observable,
      focusModeEnabled: observable,

      setOpen: action,
      setShouldAnimateCloseMenu: action,
      setFocusModeEnabled: action,
      toggle: action,
      closeQuickSettingsMenu: action,
    })

    this.disposers.push(
      application.keyboardService.addCommandHandler({
        command: TOGGLE_FOCUS_MODE_COMMAND,
        onKeyDown: (event) => {
          event.preventDefault()
          this.setFocusModeEnabled(!this.focusModeEnabled)
          return true
        },
      }),
    )
  }

  setOpen = (open: boolean): void => {
    this.open = open
  }

  setShouldAnimateCloseMenu = (shouldAnimate: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimate
  }

  setFocusModeEnabled = (enabled: boolean): void => {
    this.focusModeEnabled = enabled

    toggleFocusMode(enabled)
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
