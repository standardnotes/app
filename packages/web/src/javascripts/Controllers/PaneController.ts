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
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []
  panes: AppPaneId[] = [AppPaneId.Navigation, AppPaneId.Items]
  paneComponentsProviders: Map<AppPaneId, () => JSX.Element> = new Map()

  currentNavPanelWidth = 0
  currentItemsPanelWidth = 0

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      panes: observable,
      isInMobileView: observable,
      currentNavPanelWidth: observable,
      currentItemsPanelWidth: observable,

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
    })

    this.setCurrentNavPanelWidth(application.getPreference(PrefKey.TagsPanelWidth, MinimumNavPanelWidth))
    this.setCurrentItemsPanelWidth(application.getPreference(PrefKey.NotesPanelWidth, MinimumNotesPanelWidth))

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

  setPaneComponentProvider = (pane: AppPaneId, provider: () => JSX.Element) => {
    this.paneComponentsProviders.set(pane, provider)
  }

  getPaneComponent = (pane: AppPaneId) => {
    const provider = this.paneComponentsProviders.get(pane)
    if (!provider) {
      throw new Error(`No provider for pane ${pane}`)
    }

    return provider()
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

  setIsInMobileView(isInMobileView: boolean) {
    this.isInMobileView = isInMobileView
  }

  presentPane = (pane: AppPaneId) => {
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

  dismissLastPane = (): AppPaneId | undefined => {
    return this.panes.pop()
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
