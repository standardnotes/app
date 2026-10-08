import { InternalEventBusInterface } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { RootQueryParam, RouteServiceInterface } from '@standardnotes/ui-services'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { PreferencePaneId } from '@standardnotes/services'

const DEFAULT_PANE: PreferencePaneId = 'account'

export class PreferencesController extends AbstractViewController {
  private _open = false
  currentPane: PreferencePaneId = DEFAULT_PANE
  scrollToPreferencesSectionId: string | null = null

  constructor(
    private routeService: RouteServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable<PreferencesController, '_open'>(this, {
      _open: observable,
      currentPane: observable,
      scrollToPreferencesSectionId: observable,
      openPreferences: action,
      openPreferencesAndScrollToSection: action,
      clearPreferencesSectionScrollTarget: action,
      closePreferences: action,
      setCurrentPane: action,
      isOpen: computed,
    })
  }

  setCurrentPane = (prefId: PreferencePaneId): void => {
    this.currentPane = prefId
  }

  openPreferences = (prefId?: PreferencePaneId): void => {
    if (prefId) {
      this.currentPane = prefId
    }
    this._open = true
  }

  openPreferencesAndScrollToSection = (sectionId: string, prefId?: PreferencePaneId): void => {
    this.scrollToPreferencesSectionId = sectionId
    this.openPreferences(prefId)
  }

  clearPreferencesSectionScrollTarget = (): void => {
    this.scrollToPreferencesSectionId = null
  }

  closePreferences = (): void => {
    this._open = false
    this.currentPane = DEFAULT_PANE
    this.scrollToPreferencesSectionId = null
    this.routeService.removeQueryParameterFromURL(RootQueryParam.Settings)
  }

  get isOpen(): boolean {
    return this._open
  }
}
