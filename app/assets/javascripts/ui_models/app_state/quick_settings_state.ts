import { ContentType, SNTheme } from '@standardnotes/snjs';
import { action, computed, makeObservable, observable } from 'mobx';
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
      setRecentlyUsedThemes: action,
      setShouldAnimateCloseMenu: action,
      toggle: action,
      closeQuickSettingsMenu: action,

      recentlyUsedThemes: computed,
    });
  }

  setOpen = (open: boolean): void => {
    this.open = open;
  };

  setRecentlyUsedThemes = (recentlyUsedThemes: string[]): void => {
    this._recentlyUsedThemes = recentlyUsedThemes;
  };

  setShouldAnimateCloseMenu = (shouldAnimateCloseMenu: boolean): void => {
    this.shouldAnimateCloseMenu = shouldAnimateCloseMenu;
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
      if (this._recentlyUsedThemes.length === 3) {
        this.setRecentlyUsedThemes(
          this._recentlyUsedThemes.slice(1, this._recentlyUsedThemes.length - 1)
        );
      }
      this.setRecentlyUsedThemes([...this._recentlyUsedThemes, uuid]);
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
