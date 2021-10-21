import { PreferenceId } from '@/preferences/PreferencesMenu';
import { action, computed, makeObservable, observable } from 'mobx';

export class PreferencesState {
  private _open = false;
  currentPane: PreferenceId = 'account';

  constructor() {
    makeObservable<PreferencesState, '_open'>(this, {
      _open: observable,
      currentPane: observable,
      openPreferences: action,
      closePreferences: action,
      setCurrentPane: action,
      isOpen: computed,
    });
  }

  setCurrentPane = (prefId: PreferenceId): void => {
    this.currentPane = prefId;
  };

  openPreferences = (): void => {
    this._open = true;
  };

  closePreferences = (): void => {
    this._open = false;
    this.currentPane = 'account';
  };

  get isOpen() {
    return this._open;
  }
}
