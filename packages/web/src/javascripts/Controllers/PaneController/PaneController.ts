import {
  TOGGLE_FOCUS_MODE_COMMAND,
  TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
  TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
} from '@standardnotes/ui-services'
import { ApplicationEvent, InternalEventBus, PrefKey, removeFromArray } from '@standardnotes/snjs'
import { AppPaneId } from '../../Components/Panes/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action, computed } from 'mobx'
import { Disposer } from '@/Types/Disposer'
import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { WebApplication } from '@/Application/Application'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { log, LoggingDomain } from '@/Logging'
import { PaneLayout } from './PaneLayout'
import { panesForLayout } from './panesForLayout'
import { getIsTabletOrMobileScreen } from '@/Hooks/useIsTabletOrMobileScreen'

const MinimumNavPanelWidth = PrefDefaults[PrefKey.TagsPanelWidth]
const MinimumNotesPanelWidth = PrefDefaults[PrefKey.NotesPanelWidth]
const FOCUS_MODE_CLASS_NAME = 'focus-mode'
const DISABLING_FOCUS_MODE_CLASS_NAME = 'disable-focus-mode'
const FOCUS_MODE_ANIMATION_DURATION = 1255

export class PaneController extends AbstractViewController {
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []
  panes: AppPaneId[] = []

  currentNavPanelWidth = 0
  currentItemsPanelWidth = 0
  focusModeEnabled = false

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      panes: observable,
      isInMobileView: observable,
      currentNavPanelWidth: observable,
      currentItemsPanelWidth: observable,
      focusModeEnabled: observable,

      currentPane: computed,
      previousPane: computed,
      isListPaneCollapsed: computed,
      isNavigationPaneCollapsed: computed,

      setIsInMobileView: action,
      toggleListPane: action,
      toggleNavigationPane: action,
      setCurrentItemsPanelWidth: action,
      setCurrentNavPanelWidth: action,
      presentPane: action,
      dismissLastPane: action,
      replacePanes: action,
      popToPane: action,
      removePane: action,
      insertPaneAtIndex: action,
      setPaneLayout: action,
      setFocusModeEnabled: action,
    })

    this.setCurrentNavPanelWidth(application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
    this.setCurrentItemsPanelWidth(application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))

    const screen = getIsTabletOrMobileScreen(application)

    this.panes = screen.isTabletOrMobile
      ? [AppPaneId.Navigation, AppPaneId.Items]
      : [AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor]

    const mediaQuery = window.matchMedia(MediaQueryBreakpoints.md)
    if (mediaQuery?.addEventListener != undefined) {
      mediaQuery.addEventListener('change', this.mediumScreenMQHandler)
    } else {
      mediaQuery.addListener(this.mediumScreenMQHandler)
    }

    this.disposers.push(
      application.addEventObserver(async () => {
        this.setCurrentNavPanelWidth(application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
        this.setCurrentItemsPanelWidth(application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))
      }, ApplicationEvent.PreferencesChanged),

      application.keyboardService.addCommandHandler({
        command: TOGGLE_FOCUS_MODE_COMMAND,
        onKeyDown: (event) => {
          event.preventDefault()
          this.setFocusModeEnabled(!this.focusModeEnabled)
          return true
        },
      }),
      application.keyboardService.addCommandHandler({
        command: TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
        onKeyDown: (event) => {
          event.preventDefault()
          this.toggleListPane()
        },
      }),
      application.keyboardService.addCommandHandler({
        command: TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
        onKeyDown: (event) => {
          event.preventDefault()
          this.toggleNavigationPane()
        },
      }),
    )
  }

  setCurrentNavPanelWidth(width: number) {
    this.currentNavPanelWidth = width
  }

  setCurrentItemsPanelWidth(width: number) {
    this.currentItemsPanelWidth = width
  }

  deinit() {
    super.deinit()
    const mq = window.matchMedia(MediaQueryBreakpoints.md)
    if (mq?.removeEventListener != undefined) {
      mq.removeEventListener('change', this.mediumScreenMQHandler)
    } else {
      mq.removeListener(this.mediumScreenMQHandler)
    }
  }

  get currentPane(): AppPaneId {
    return this.panes[this.panes.length - 1] || this.panes[0]
  }

  get previousPane(): AppPaneId {
    return this.panes[this.panes.length - 2] || this.panes[0]
  }

  mediumScreenMQHandler = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.setIsInMobileView(false)
    } else {
      this.setIsInMobileView(true)
    }
  }

  setIsInMobileView = (isInMobileView: boolean) => {
    this.isInMobileView = isInMobileView
  }

  setPaneLayout = (layout: PaneLayout) => {
    log(LoggingDomain.Panes, 'Set pane layout', layout)

    this.replacePanes(panesForLayout(layout, this.application))
  }

  replacePanes = (panes: AppPaneId[]) => {
    log(LoggingDomain.Panes, 'Replacing panes', panes)

    this.panes = panes
  }

  presentPane = (pane: AppPaneId) => {
    log(LoggingDomain.Panes, 'Presenting pane', pane)

    if (pane === this.currentPane) {
      return
    }

    if (pane === AppPaneId.Items && this.currentPane === AppPaneId.Editor) {
      this.dismissLastPane()
      return
    }

    if (this.currentPane !== pane) {
      this.panes.push(pane)
    }
  }

  insertPaneAtIndex = (pane: AppPaneId, index: number) => {
    log(LoggingDomain.Panes, 'Inserting pane', pane, 'at index', index)

    this.panes.splice(index, 0, pane)
  }

  dismissLastPane = (): AppPaneId | undefined => {
    log(LoggingDomain.Panes, 'Dismissing last pane')

    return this.panes.pop()
  }

  removePane = (pane: AppPaneId) => {
    log(LoggingDomain.Panes, 'Removing pane', pane)

    removeFromArray(this.panes, pane)
  }

  popToPane = (pane: AppPaneId) => {
    log(LoggingDomain.Panes, 'Popping to pane', pane)

    let index = this.panes.length - 1
    while (index >= 0) {
      if (this.panes[index] === pane) {
        break
      }

      this.dismissLastPane()
      index--
    }
  }

  toggleListPane = () => {
    if (this.panes.includes(AppPaneId.Items)) {
      this.removePane(AppPaneId.Items)
    } else {
      if (this.panes.includes(AppPaneId.Navigation)) {
        this.insertPaneAtIndex(AppPaneId.Items, 1)
      } else {
        this.insertPaneAtIndex(AppPaneId.Items, 0)
      }
    }
  }

  toggleNavigationPane = () => {
    if (this.panes.includes(AppPaneId.Navigation)) {
      this.removePane(AppPaneId.Navigation)
    } else {
      this.insertPaneAtIndex(AppPaneId.Navigation, 0)
    }
  }

  get isListPaneCollapsed() {
    return !this.panes.includes(AppPaneId.Items)
  }

  get isNavigationPaneCollapsed() {
    return !this.panes.includes(AppPaneId.Navigation)
  }

  setFocusModeEnabled = (enabled: boolean): void => {
    this.focusModeEnabled = enabled

    if (enabled) {
      document.body.classList.add(FOCUS_MODE_CLASS_NAME)
      return
    }

    if (document.body.classList.contains(FOCUS_MODE_CLASS_NAME)) {
      document.body.classList.add(DISABLING_FOCUS_MODE_CLASS_NAME)
      document.body.classList.remove(FOCUS_MODE_CLASS_NAME)

      setTimeout(() => {
        document.body.classList.remove(DISABLING_FOCUS_MODE_CLASS_NAME)
      }, FOCUS_MODE_ANIMATION_DURATION)
    }
  }
}
