import { RefObject } from 'preact';
import { StateUpdater } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';

export const quickSettingsKeyDownHandler = (
  closeQuickSettingsMenu: () => void,
  event: JSXInternal.TargetedKeyboardEvent<HTMLDivElement>,
  quickSettingsMenuRef: RefObject<HTMLDivElement>,
  themesMenuOpen: boolean
) => {
  if (quickSettingsMenuRef?.current) {
    const items: NodeListOf<HTMLButtonElement> =
      quickSettingsMenuRef.current.querySelectorAll(':scope > button');
    const currentFocusedIndex = Array.from(items).findIndex(
      (btn) => btn === document.activeElement
    );

    if (!themesMenuOpen) {
      switch (event.key) {
        case 'Escape':
          closeQuickSettingsMenu();
          break;
        case 'ArrowDown':
          if (items[currentFocusedIndex + 1]) {
            items[currentFocusedIndex + 1].focus();
          } else {
            items[0].focus();
          }
          break;
        case 'ArrowUp':
          if (items[currentFocusedIndex - 1]) {
            items[currentFocusedIndex - 1].focus();
          } else {
            items[items.length - 1].focus();
          }
          break;
      }
    }
  }
};

export const themesMenuKeyDownHandler = (
  event: React.KeyboardEvent<HTMLDivElement>,
  themesMenuRef: RefObject<HTMLDivElement>,
  setThemesMenuOpen: StateUpdater<boolean>,
  themesButtonRef: RefObject<HTMLButtonElement>
) => {
  if (themesMenuRef?.current) {
    const themes = themesMenuRef.current.querySelectorAll('button');
    const currentFocusedIndex = Array.from(themes).findIndex(
      (themeBtn) => themeBtn === document.activeElement
    );

    switch (event.key) {
      case 'Escape':
      case 'ArrowLeft':
        event.stopPropagation();
        setThemesMenuOpen(false);
        themesButtonRef.current?.focus();
        break;
      case 'ArrowDown':
        if (themes[currentFocusedIndex + 1]) {
          themes[currentFocusedIndex + 1].focus();
        } else {
          themes[0].focus();
        }
        break;
      case 'ArrowUp':
        if (themes[currentFocusedIndex - 1]) {
          themes[currentFocusedIndex - 1].focus();
        } else {
          themes[themes.length - 1].focus();
        }
        break;
    }
  }
};
