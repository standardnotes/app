import { WebApplication } from '@/ui_models/application';
import { AppState } from '@/ui_models/app_state';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@reach/disclosure';
import { ContentType, SNTheme } from '@standardnotes/snjs';
import { observer } from 'mobx-react-lite';
import { FunctionComponent } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { JSXInternal } from 'preact/src/jsx';
import { Icon } from './Icon';
import { toDirective, useCloseOnBlur } from './utils';

const MENU_CLASSNAME =
  'sn-menu-border sn-dropdown min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto';

type ThemeButtonProps = {
  theme: SNTheme;
  application: WebApplication;
  onBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

type MenuProps = {
  appState: AppState;
  application: WebApplication;
};

const ThemeButton: FunctionComponent<ThemeButtonProps> = ({
  application,
  theme,
  onBlur,
}) => {
  const toggleTheme = () => {
    if (theme.isLayerable() || !theme.active) {
      application.toggleComponent(theme);
    }
  };

  return (
    <button
      className="sn-dropdown-item justify-between focus:bg-info-backdrop focus:shadow-none"
      onClick={toggleTheme}
      onBlur={onBlur}
    >
      <div className="flex items-center">
        {theme.isLayerable() ? (
          theme.active ? (
            <Icon type="check" className="color-info mr-2" />
          ) : null
        ) : (
          <div
            className={`pseudo-radio-btn ${
              theme.active ? 'pseudo-radio-btn--checked' : ''
            } mr-2`}
          ></div>
        )}
        <span className={theme.active ? 'font-semibold' : undefined}>
          {theme.package_info.name}
        </span>
      </div>
      <div
        className="w-5 h-5 rounded-full"
        style={{
          backgroundColor: theme.package_info?.dock_icon?.background_color,
        }}
      ></div>
    </button>
  );
};

const QuickSettingsMenu: FunctionComponent<MenuProps> = observer(
  ({ application, appState }) => {
    const { closeQuickSettingsMenu, shouldAnimateCloseMenu } =
      appState.quickSettingsMenu;
    const [themes, setThemes] = useState<SNTheme[]>([]);
    const [themesMenuOpen, setThemesMenuOpen] = useState(false);
    const [themesMenuPosition, setThemesMenuPosition] = useState({});
    const [defaultThemeOn, setDefaultThemeOn] = useState(false);

    const reloadThemes = useCallback(() => {
      application.streamItems(ContentType.Theme, () => {
        const themes = application.getDisplayableItems(
          ContentType.Theme
        ) as SNTheme[];
        setThemes(
          themes.sort((a, b) => {
            const aIsLayerable = a.isLayerable();
            const bIsLayerable = b.isLayerable();

            if (aIsLayerable && !bIsLayerable) {
              return 1;
            } else if (!aIsLayerable && bIsLayerable) {
              return -1;
            } else {
              return a.package_info.name.toLowerCase() <
                b.package_info.name.toLowerCase()
                ? -1
                : 1;
            }
          })
        );
        setDefaultThemeOn(
          !themes.find((theme) => theme.active && !theme.isLayerable())
        );
      });
    }, [application]);

    useEffect(() => {
      reloadThemes();
    }, [reloadThemes]);

    useEffect(() => {
      if (themesMenuOpen && themesMenuRef.current) {
        themesMenuRef.current.querySelector('button')?.focus();
      }
    }, [themesMenuOpen]);

    const themesMenuRef = useRef<HTMLDivElement>();
    const themesButtonRef = useRef<HTMLButtonElement>();
    const quickSettingsMenuRef = useRef<HTMLDivElement>();

    useEffect(() => {
      if (themesButtonRef) themesButtonRef.current.focus();
    }, []);

    const [closeOnBlur] = useCloseOnBlur(themesMenuRef, setThemesMenuOpen);

    const toggleThemesMenu = () => {
      if (!themesMenuOpen) {
        const themesButtonRect =
          themesButtonRef.current.getBoundingClientRect();
        setThemesMenuPosition({
          left: themesButtonRect.right,
          bottom:
            document.documentElement.clientHeight - themesButtonRect.bottom,
        });
        setThemesMenuOpen(true);
      } else {
        setThemesMenuOpen(false);
      }
    };

    const openPreferences = () => {
      closeQuickSettingsMenu();
      appState.preferences.openPreferences();
    };

    const handleBtnKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
      event
    ) => {
      switch (event.key) {
        case 'Escape':
          setThemesMenuOpen(false);
          themesButtonRef.current.focus();
          break;
        case 'ArrowRight':
          if (!themesMenuOpen) toggleThemesMenu();
      }
    };

    const handleQuickSettingsKeyDown: JSXInternal.KeyboardEventHandler<HTMLDivElement> =
      (event) => {
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
      };

    const handlePanelKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (
      event
    ) => {
      const themes = themesMenuRef.current.querySelectorAll('button');
      const currentFocusedIndex = Array.from(themes).findIndex(
        (themeBtn) => themeBtn === document.activeElement
      );

      switch (event.key) {
        case 'Escape':
        case 'ArrowLeft':
          event.stopPropagation();
          setThemesMenuOpen(false);
          themesButtonRef.current.focus();
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
    };

    const toggleDefaultTheme = () => {
      const activeTheme = themes.find(
        (theme) => theme.active && !theme.isLayerable()
      );
      if (activeTheme) application.toggleComponent(activeTheme);
    };

    return (
      <div className="sn-component">
        <div
          className={`sn-quick-settings-menu absolute ${MENU_CLASSNAME} ${
            shouldAnimateCloseMenu
              ? 'slide-up-animation'
              : 'sn-dropdown--animated'
          }`}
          ref={quickSettingsMenuRef}
          onKeyDown={handleQuickSettingsKeyDown}
        >
          <div className="px-3 mt-1 mb-2 font-semibold color-text uppercase">
            Quick Settings
          </div>
          <Disclosure open={themesMenuOpen} onChange={toggleThemesMenu}>
            <DisclosureButton
              onKeyDown={handleBtnKeyDown}
              onBlur={closeOnBlur}
              ref={themesButtonRef}
              className="sn-dropdown-item justify-between focus:bg-info-backdrop focus:shadow-none"
            >
              <div className="flex items-center">
                <Icon type="themes" className="color-neutral mr-2" />
                Themes
              </div>
              <Icon type="chevron-right" className="color-neutral" />
            </DisclosureButton>
            <DisclosurePanel
              onBlur={closeOnBlur}
              ref={themesMenuRef}
              onKeyDown={handlePanelKeyDown}
              style={{
                ...themesMenuPosition,
              }}
              className={`${MENU_CLASSNAME} fixed sn-dropdown--animated`}
            >
              <div className="px-3 my-1 font-semibold color-text uppercase">
                Themes
              </div>
              <button
                className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
                onClick={toggleDefaultTheme}
                onBlur={closeOnBlur}
              >
                <div
                  className={`pseudo-radio-btn ${
                    defaultThemeOn ? 'pseudo-radio-btn--checked' : ''
                  } mr-2`}
                ></div>
                Default
              </button>
              {themes.map((theme) => (
                <ThemeButton
                  theme={theme}
                  application={application}
                  key={theme.uuid}
                  onBlur={closeOnBlur}
                />
              ))}
            </DisclosurePanel>
          </Disclosure>
          <div className="h-1px my-2 bg-border"></div>
          <button
            class="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
            onClick={openPreferences}
          >
            <Icon type="more" className="color-neutral mr-2" />
            Open Preferences
          </button>
        </div>
      </div>
    );
  }
);

export const QuickSettingsMenuDirective =
  toDirective<MenuProps>(QuickSettingsMenu);
