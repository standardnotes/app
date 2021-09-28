import { action, computed, makeObservable, observable } from 'mobx';

export class PreferencesState {
  private _open = false;
  private _purchaseIframeOpen = false;

  constructor() {
    makeObservable<PreferencesState, '_open' | '_purchaseIframeOpen'>(this, {
      _open: observable,
      _purchaseIframeOpen: observable,
      openPreferences: action,
      closePreferences: action,
      openPurchaseIframe: action,
      closePurchaseIframe: action,
      isOpen: computed,
      isPurchaseIframeOpen: computed
    });
  }

  openPreferences = (): void => {
    this._open = true;
  };

  closePreferences = (): void => {
    this._open = false;
  };

  openPurchaseIframe = (): void => {
    this._purchaseIframeOpen = true;
  }

  closePurchaseIframe = (): void => {
    this._purchaseIframeOpen = false;
  }

  get isOpen(): boolean {
    return this._open;
  }

  get isPurchaseIframeOpen(): boolean {
    return this._purchaseIframeOpen;
  }
}
