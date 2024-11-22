import { PanesForLayout } from './../../Application/UseCase/PanesForLayout'
import {
  InternalEventHandlerInterface,
  InternalEventInterface,
  LocalPrefDefaults,
  LocalPrefKey,
  PreferenceServiceInterface,
} from '@standardnotes/services'
import {
  KeyboardService,
  TOGGLE_FOCUS_MODE_COMMAND,
  TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
  TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
} from '@standardnotes/ui-services'
import {
  ApplicationEvent,
  InternalEventBusInterface,
  PrefKey,
  removeFromArray,
  PrefDefaults,
} from '@standardnotes/snjs'
import { AppPaneId } from '../../Components/Panes/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action, computed } from 'mobx'
import { Disposer } from '@/Types/Disposer'
import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { log, LoggingDomain } from '@/Logging'
import { PaneLayout } from './PaneLayout'
import { IsTabletOrMobileScreen } from '@/Application/UseCase/IsTabletOrMobileScreen'

const MinimumNavPanelWidth = PrefDefaults[PrefKey.TagsPanelWidth]
const MinimumNotesPanelWidth = PrefDefaults[PrefKey.NotesPanelWidth]
const FOCUS_MODE_CLASS_NAME = 'focus-mode'
const DISABLING_FOCUS_MODE_CLASS_NAME = 'disable-focus-mode'
const FOCUS_MODE_ANIMATION_DURATION = 1255

export class PaneController extends AbstractViewController implements InternalEventHandlerInterface {
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []
  panes: AppPaneId[] = []

  currentNavPanelWidth = 0
  currentItemsPanelWidth = 0
  focusModeEnabled = false
  hasPaneInitializationLogicRun = false

  listPaneExplicitelyCollapsed = this.preferences.getLocalValue(
    LocalPrefKey.ListPaneCollapsed,
    LocalPrefDefaults[LocalPrefKey.ListPaneCollapsed],
  )
  navigationPaneExplicitelyCollapsed = this.preferences.getLocalValue(
    LocalPrefKey.NavigationPaneCollapsed,
    LocalPrefDefaults[LocalPrefKey.NavigationPaneCollapsed],
  )

  constructor(
    private preferences: PreferenceServiceInterface,
    private keyboardService: KeyboardService,
    private _isTabletOrMobileScreen: IsTabletOrMobileScreen,
    private _panesForLayout: PanesForLayout,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

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

    this.setCurrentNavPanelWidth(preferences.getValue(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
    this.setCurrentItemsPanelWidth(preferences.getValue(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))

    const mediaQuery = window.matchMedia(MediaQueryBreakpoints.md)
    if (mediaQuery?.addEventListener != undefined) {
      mediaQuery.addEventListener('change', this.mediumScreenMQHandler)
    } else {
      mediaQuery.addListener(this.mediumScreenMQHandler)
    }

    eventBus.addEventHandler(this, ApplicationEvent.PreferencesChanged)
    eventBus.addEventHandler(this, ApplicationEvent.LocalPreferencesChanged)

    this.disposers.push(
      keyboardService.addCommandHandler({
        command: TOGGLE_FOCUS_MODE_COMMAND,
        category: 'General',
        description: 'Toggle focus mode',
        onKeyDown: (event) => {
          event.preventDefault()
          this.setFocusModeEnabled(!this.focusModeEnabled)
          return true
        },
      }),
      keyboardService.addCommandHandler({
        command: TOGGLE_LIST_PANE_KEYBOARD_COMMAND,
        category: 'General',
        description: 'Toggle notes panel',
        onKeyDown: (event) => {
          event.preventDefault()
          this.toggleListPane()
        },
      }),
      keyboardService.addCommandHandler({
        command: TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND,
        category: 'General',
        description: 'Toggle tags panel',
        onKeyDown: (event) => {
          event.preventDefault()
          this.toggleNavigationPane()
        },
      }),
    )
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.PreferencesChanged) {
      this.setCurrentNavPanelWidth(this.preferences.getValue(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
      this.setCurrentItemsPanelWidth(this.preferences.getValue(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))
    }
    if (event.type === ApplicationEvent.LocalPreferencesChanged) {
      this.listPaneExplicitelyCollapsed = this.preferences.getLocalValue(
        LocalPrefKey.ListPaneCollapsed,
        LocalPrefDefaults[LocalPrefKey.ListPaneCollapsed],
      )
      this.navigationPaneExplicitelyCollapsed = this.preferences.getLocalValue(
        LocalPrefKey.NavigationPaneCollapsed,
        LocalPrefDefaults[LocalPrefKey.NavigationPaneCollapsed],
      )

      if (!this.hasPaneInitializationLogicRun) {
        const screen = this._isTabletOrMobileScreen.execute().getValue()
        if (screen.isTabletOrMobile) {
          this.panes = [AppPaneId.Navigation, AppPaneId.Items]
        } else {
          if (!this.listPaneExplicitelyCollapsed && !this.navigationPaneExplicitelyCollapsed) {
            this.panes = [AppPaneId.Navigation, AppPaneId.Items, AppPaneId.Editor]
          } else if (this.listPaneExplicitelyCollapsed && this.navigationPaneExplicitelyCollapsed) {
            this.panes = [AppPaneId.Editor]
          } else if (this.listPaneExplicitelyCollapsed) {
            this.panes = [AppPaneId.Navigation, AppPaneId.Editor]
          } else {
            this.panes = [AppPaneId.Items, AppPaneId.Editor]
          }
        }
        this.hasPaneInitializationLogicRun = true
      }
    }
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

    const panes = this._panesForLayout.execute(layout).getValue()

    if (panes.includes(AppPaneId.Items) && this.listPaneExplicitelyCollapsed) {
      removeFromArray(panes, AppPaneId.Items)
    }

    if (panes.includes(AppPaneId.Navigation) && this.navigationPaneExplicitelyCollapsed) {
      removeFromArray(panes, AppPaneId.Navigation)
    }

    this.replacePanes(panes)
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
      this.preferences.setLocalValue(LocalPrefKey.ListPaneCollapsed, true)
    } else {
      if (this.panes.includes(AppPaneId.Navigation)) {
        this.insertPaneAtIndex(AppPaneId.Items, 1)
      } else {
        this.insertPaneAtIndex(AppPaneId.Items, 0)
      }
      this.preferences.setLocalValue(LocalPrefKey.ListPaneCollapsed, false)
    }
  }

  toggleNavigationPane = () => {
    if (this.panes.includes(AppPaneId.Navigation)) {
      this.removePane(AppPaneId.Navigation)
      this.preferences.setLocalValue(LocalPrefKey.NavigationPaneCollapsed, true)
    } else {
      this.insertPaneAtIndex(AppPaneId.Navigation, 0)
      this.preferences.setLocalValue(LocalPrefKey.NavigationPaneCollapsed, false)
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
