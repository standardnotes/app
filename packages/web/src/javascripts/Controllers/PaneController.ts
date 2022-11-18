import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { ApplicationEvent, InternalEventBus, PrefKey } from '@standardnotes/snjs'
import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action, computed } from 'mobx'
import { Disposer } from '@/Types/Disposer'
import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { WebApplication } from '@/Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { PANEL_NAME_NAVIGATION, PANEL_NAME_NOTES } from '@/Constants/Constants'

const WidthForCollapsedPanel = 5
const MinimumNavPanelWidth = PrefDefaults[PrefKey.TagsPanelWidth]
const MinimumNotesPanelWidth = PrefDefaults[PrefKey.NotesPanelWidth]

export class PaneController extends AbstractViewController {
  currentPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  previousPane: AppPaneId = isMobileScreen() ? AppPaneId.Items : AppPaneId.Editor
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []

  currentNavPanelWidth: number
  currentItemsPanelWidth: number

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      currentPane: observable,
      previousPane: observable,
      isInMobileView: observable,

      isListPaneCollapsed: computed,
      isNavigationPaneCollapsed: computed,

      setCurrentPane: action,
      setPreviousPane: action,
      setIsInMobileView: action,
      toggleListPane: action,
      toggleNavigationPane: action,
    })

    this.currentNavPanelWidth = application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)
    this.currentItemsPanelWidth = application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)

    const mediaQuery = window.matchMedia(MediaQueryBreakpoints.md)
    if (mediaQuery?.addEventListener != undefined) {
      mediaQuery.addEventListener('change', this.mediumScreenMQHandler)
    } else {
      mediaQuery.addListener(this.mediumScreenMQHandler)
    }

    this.disposers.push(
      application.addEventObserver(async () => {
        this.currentNavPanelWidth = application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)
        this.currentItemsPanelWidth = application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)
      }, ApplicationEvent.PreferencesChanged),

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

  deinit() {
    super.deinit()
    const mq = window.matchMedia(MediaQueryBreakpoints.md)
    if (mq?.removeEventListener != undefined) {
      mq.removeEventListener('change', this.mediumScreenMQHandler)
    } else {
      mq.removeListener(this.mediumScreenMQHandler)
    }
  }

  mediumScreenMQHandler = (event: MediaQueryListEvent) => {
    if (event.matches) {
      this.setIsInMobileView(false)
    } else {
      this.setIsInMobileView(true)
    }
  }

  setCurrentPane(pane: AppPaneId): void {
    this.currentPane = pane
  }

  setPreviousPane(pane: AppPaneId): void {
    this.previousPane = pane
  }

  setIsInMobileView(isInMobileView: boolean) {
    this.isInMobileView = isInMobileView
  }

  toggleListPane = () => {
    const currentItemsPanelWidth = this.application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)

    const isCollapsed = currentItemsPanelWidth <= WidthForCollapsedPanel
    if (isCollapsed) {
      void this.application.setPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth)
    } else {
      void this.application.setPreference(PrefKey.NotesPanelWidth, WidthForCollapsedPanel)
    }

    this.application.publishPanelDidResizeEvent(PANEL_NAME_NOTES, !isCollapsed)
  }

  toggleNavigationPane = () => {
    const currentNavPanelWidth = this.application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)

    const isCollapsed = currentNavPanelWidth <= WidthForCollapsedPanel
    if (isCollapsed) {
      void this.application.setPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth)
    } else {
      void this.application.setPreference(PrefKey.TagsPanelWidth, WidthForCollapsedPanel)
    }

    this.application.publishPanelDidResizeEvent(PANEL_NAME_NAVIGATION, !isCollapsed)
  }

  get isListPaneCollapsed() {
    return this.currentItemsPanelWidth > WidthForCollapsedPanel
  }

  get isNavigationPaneCollapsed() {
    return this.currentNavPanelWidth > WidthForCollapsedPanel
  }
}
