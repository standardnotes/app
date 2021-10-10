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
import { Icon } from './Icon';
import { toDirective, useCloseOnBlur } from './utils';

type ThemeButtonProps = {
  theme: SNTheme;
  application: WebApplication;
  addToRecents: (uuid: string) => void;
  onBlur: (event: { relatedTarget: EventTarget | null }) => void;
};

type MenuProps = {
  appState: AppState;
  application: WebApplication;
};

const ThemeButton: FunctionComponent<ThemeButtonProps> = ({
  application,
  theme,
  addToRecents,
  onBlur,
}) => (
  <button
    className="sn-dropdown-item justify-between"
    onClick={() => {
      application.toggleComponent(theme);
      addToRecents(theme.uuid);
    }}
    onBlur={onBlur}
  >
    <div className="flex items-center">
      {theme.active ? <Icon type="check" className="mr-2" /> : null}
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

const QuickSettingsMenu: FunctionComponent<MenuProps> = observer(
  ({ application, appState }) => {
    const {
      recentlyUsedThemes,
      addThemeToRecents,
      closeQuickSettingsMenu,
      shouldAnimateCloseMenu,
    } = appState.quickSettingsMenu;
    const [themes, setThemes] = useState<SNTheme[]>([]);
    const [themesMenuOpen, setThemesMenuOpen] = useState(false);
    const [themesMenuPosition, setThemesMenuPosition] = useState({});
    const [viewAllThemes, setViewAllThemes] = useState(
      () => recentlyUsedThemes.length === 0
    );

    const reloadThemes = useCallback(() => {
      application.streamItems(ContentType.Theme, () => {
        const themes = application.getDisplayableItems(
          ContentType.Theme
        ) as SNTheme[];
        setThemes(
          themes.sort((a, b) => {
            return a.package_info.name.toLowerCase() <
              b.package_info.name.toLowerCase()
              ? -1
              : 1;
          })
        );
      });
    }, [application]);

    useEffect(() => {
      reloadThemes();
    }, [reloadThemes]);

    const themesMenuRef = useRef<HTMLDivElement>();
    const themesButtonRef = useRef<HTMLButtonElement>();

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

    const toggleViewAllThemes = () => {
      setViewAllThemes(!viewAllThemes);
    };

    const openPreferences = () => {
      closeQuickSettingsMenu();
      appState.preferences.openPreferences();
    };

    const closeThemesMenu: React.KeyboardEventHandler<
      HTMLButtonElement | HTMLDivElement
    > = (event) => {
      if (event.key === 'Escape') {
        setThemesMenuOpen(false);
        themesButtonRef.current.focus();
      }
    };

    return (
      <div className="sn-component">
        <div
          className={`sn-account-menu sn-dropdown ${
            shouldAnimateCloseMenu
              ? 'slide-up-animation'
              : 'sn-dropdown--animated'
          } min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto absolute`}
        >
          <div className="px-3 mt-1 mb-2 font-semibold color-text uppercase">
            Quick Settings
          </div>
          <Disclosure open={themesMenuOpen} onChange={toggleThemesMenu}>
            <DisclosureButton
              onKeyDown={closeThemesMenu}
              onBlur={closeOnBlur}
              ref={themesButtonRef}
              className="sn-dropdown-item justify-between"
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
              onKeyDown={closeThemesMenu}
              style={{
                ...themesMenuPosition,
              }}
              className="sn-dropdown sn-dropdown--animated min-w-80 flex flex-col py-2 max-h-120 max-w-xs fixed overflow-y-auto"
            >
              <div className="px-3 my-1 font-semibold color-text uppercase">
                {viewAllThemes ? 'Themes' : 'Recently Used'}
              </div>
              {viewAllThemes ? (
                <>
                  {themes.map((theme) => (
                    <ThemeButton
                      theme={theme}
                      application={application}
                      addToRecents={addThemeToRecents}
                      key={theme.uuid}
                      onBlur={closeOnBlur}
                    />
                  ))}
                </>
              ) : (
                <>
                  {recentlyUsedThemes.map((theme) => (
                    <ThemeButton
                      theme={theme}
                      application={application}
                      addToRecents={addThemeToRecents}
                      key={theme.uuid}
                      onBlur={closeOnBlur}
                    />
                  ))}
                  <div className="h-1px my-2 bg-border"></div>
                  <button
                    className="sn-dropdown-item"
                    onClick={toggleViewAllThemes}
                  >
                    View all themes
                  </button>
                </>
              )}
            </DisclosurePanel>
          </Disclosure>
          <div className="h-1px my-2 bg-border"></div>
          <button class="sn-dropdown-item" onClick={openPreferences}>
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
