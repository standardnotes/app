import { action, computed, makeObservable, observable } from 'mobx';

export class PreferencesState {
  private _open = true;

  constructor() {
    makeObservable<PreferencesState, '_open'>(this, {
      _open: observable,
      open: action,
      close: action,
      isOpen: computed,
    });
  }

  open = (): void => {
    this._open = true;
  };

  close = (): void => {
    this._open = false;
  };

  get isOpen() {
    return this._open;
  }
}
