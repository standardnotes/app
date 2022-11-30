import { TOGGLE_LIST_PANE_KEYBOARD_COMMAND, TOGGLE_NAVIGATION_PANE_KEYBOARD_COMMAND } from '@standardnotes/ui-services'
import { ApplicationEvent, InternalEventBus, PrefKey, removeFromArray } from '@standardnotes/snjs'
import { AppPaneId } from './../Components/ResponsivePane/AppPaneMetadata'
import { isMobileScreen } from '@/Utils'
import { makeObservable, observable, action, computed } from 'mobx'
import { Disposer } from '@/Types/Disposer'
import { MediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { WebApplication } from '@/Application/Application'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { PANEL_NAME_NAVIGATION, PANEL_NAME_NOTES } from '@/Constants/Constants'
import { log, LoggingDomain } from '@/Logging'
import { PaneLayout } from './PaneLayout'
import { panesForLayout } from './panesForLayout'

const WidthForCollapsedPanel = 5
const MinimumNavPanelWidth = PrefDefaults[PrefKey.TagsPanelWidth]
const MinimumNotesPanelWidth = PrefDefaults[PrefKey.NotesPanelWidth]
export type PaneComponentOptions = { userWidth?: number; className?: string }
export type PaneComponentProvider = (options: PaneComponentOptions) => JSX.Element

export class PaneController extends AbstractViewController {
  isInMobileView = isMobileScreen()
  protected disposers: Disposer[] = []
  panes: AppPaneId[] = [AppPaneId.Navigation]
  paneComponentsProviders: Map<AppPaneId, PaneComponentProvider> = new Map()

  currentNavPanelWidth = 0
  currentItemsPanelWidth = 0

  animatingEntraceOfPanes: AppPaneId[] = []

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      panes: observable,
      isInMobileView: observable,
      currentNavPanelWidth: observable,
      currentItemsPanelWidth: observable,
      animatingEntraceOfPanes: observable,
      paneComponentsProviders: observable,

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

    return this.replacePanes(panesForLayout(layout))
  }

  replacePanes = async (panes: AppPaneId[]) => {
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
