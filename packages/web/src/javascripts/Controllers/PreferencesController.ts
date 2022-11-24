import { InternalEventBus } from '@standardnotes/snjs'
import { action, computed, makeObservable, observable } from 'mobx'
import { PreferenceId, RootQueryParam } from '@standardnotes/ui-services'
import { AbstractViewController } from './Abstract/AbstractViewController'
import { WebApplication } from '@/Application/Application'

const DEFAULT_PANE: PreferenceId = 'account'

export class PreferencesController extends AbstractViewController {
  private _open = false
  currentPane: PreferenceId = DEFAULT_PANE

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable<PreferencesController, '_open'>(this, {
      _open: observable,
      currentPane: observable,
      openPreferences: action,
      closePreferences: action,
      setCurrentPane: action,
      isOpen: computed,
    })
  }

  setCurrentPane = (prefId: PreferenceId): void => {
    this.currentPane = prefId
  }

  openPreferences = (): void => {
    this._open = true
  }

  closePreferences = (): void => {
    this._open = false
    this.currentPane = DEFAULT_PANE
    this.application.routeService.removeQueryParameterFromURL(RootQueryParam.Settings)
  }

  get isOpen(): boolean {
    return this._open
  }
}
