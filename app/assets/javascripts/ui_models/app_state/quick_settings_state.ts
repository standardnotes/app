import { action, makeObservable, observable } from 'mobx';

export class QuickSettingsState {
  open = false;
  shouldAnimateCloseMenu = false;

  constructor() {
    makeObservable(this, {
      open: observable,
      shouldAnimateCloseMenu: observable,

      setOpen: action,
      setShouldAnimateCloseMenu: action,
      toggle: action,
      closeQuickSettingsMenu: action,
    });
  }

  setOpen = (open: boolean): void => {
    this.open = open;
  };

  setShouldAnimateCloseMenu = (shouldAnimate: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimate;
  };

  toggle = (): void => {
    if (this.open) {
      this.closeQuickSettingsMenu();
    } else {
      this.setOpen(true);
    }
  };

  closeQuickSettingsMenu = (): void => {
    this.setShouldAnimateCloseMenu(true);
    setTimeout(() => {
      this.setOpen(false);
      this.setShouldAnimateCloseMenu(false);
    }, 150);
  };
}
