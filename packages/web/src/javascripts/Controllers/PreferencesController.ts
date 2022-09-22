import { PreferenceId } from '@/Components/Preferences/PreferencesMenu'
import { action, computed, makeObservable, observable } from 'mobx'

const DEFAULT_PANE = 'account'

export class PreferencesController {
  private _open = false
  currentPane: PreferenceId = DEFAULT_PANE

  constructor() {
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
    this.removePreferencesToggleFromURLQueryParameters()
  }

  get isOpen(): boolean {
    return this._open
  }

  private removePreferencesToggleFromURLQueryParameters() {
    const urlSearchParams = new URLSearchParams(window.location.search)
    urlSearchParams.delete('settings')

    const newUrl = `${window.location.origin}${window.location.pathname}${urlSearchParams.toString()}`
    window.history.replaceState(null, document.title, newUrl)
  }
}
