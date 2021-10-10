import { ContentType, SNTheme } from '@standardnotes/snjs';
import { action, makeObservable, observable } from 'mobx';
import { WebApplication } from '../application';

export class QuickSettingsState {
  open = false;
  shouldAnimateCloseMenu = false;
  private _recentlyUsedThemes: string[] = [];

  constructor(private application: WebApplication) {
    makeObservable<QuickSettingsState, '_recentlyUsedThemes'>(this, {
      open: observable,
      shouldAnimateCloseMenu: observable,
      _recentlyUsedThemes: observable,

      setOpen: action,
      setShouldAnimateCloseMenu: action,
      toggle: action,
      closeQuickSettingsMenu: action,
      addThemeToRecents: action,
    });
  }

  setOpen = (open: boolean): void => {
    this.open = open;
  };

  setShouldAnimateCloseMenu = (shouldAnimate: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimate;
  };

  toggle = (): void => {
    if (this.open) this.closeQuickSettingsMenu();
    else this.setOpen(true);
  };

  closeQuickSettingsMenu = (): void => {
    this.setShouldAnimateCloseMenu(true);
    setTimeout(() => {
      this.setOpen(false);
      this.setShouldAnimateCloseMenu(false);
    }, 150);
  };

  addThemeToRecents = (uuid: string): void => {
    if (!this._recentlyUsedThemes.includes(uuid)) {
      if (this._recentlyUsedThemes.length === 3) this._recentlyUsedThemes.pop();
      this._recentlyUsedThemes.push(uuid);
    }
  };

  get recentlyUsedThemes(): SNTheme[] {
    const themes = this.application.getDisplayableItems(
      ContentType.Theme
    ) as SNTheme[];
    return this._recentlyUsedThemes.map(
      (uuid) => themes[themes.findIndex((theme) => theme.uuid === uuid)]
    );
  }
}
