import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@reach/disclosure'
import { ComponentArea, ContentType, FeatureIdentifier, GetFeatures, SNComponent } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, KeyboardEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { quickSettingsKeyDownHandler, themesMenuKeyDownHandler } from './EventHandlers'
import FocusModeSwitch from './FocusModeSwitch'
import ThemesMenuButton from './ThemesMenuButton'
import { useCloseOnClickOutside } from '@/Hooks/useCloseOnClickOutside'
import { ThemeItem } from './ThemeItem'
import { sortThemes } from '@/Utils/SortThemes'

const focusModeAnimationDuration = 1255

const MENU_CLASSNAME = 'sn-dropdown min-w-80 max-h-120 max-w-xs flex flex-col py-2 overflow-y-auto'

type MenuProps = {
  appState: AppState
  application: WebApplication
  onClickOutside: () => void
}

const toggleFocusMode = (enabled: boolean) => {
  if (enabled) {
    document.body.classList.add('focus-mode')
  } else {
    if (document.body.classList.contains('focus-mode')) {
      document.body.classList.add('disable-focus-mode')
      document.body.classList.remove('focus-mode')
      setTimeout(() => {
        document.body.classList.remove('disable-focus-mode')
      }, focusModeAnimationDuration)
    }
  }
}

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ application, appState, onClickOutside }) => {
  const { closeQuickSettingsMenu, shouldAnimateCloseMenu, focusModeEnabled, setFocusModeEnabled } =
    appState.quickSettingsMenu
  const [themes, setThemes] = useState<ThemeItem[]>([])
  const [toggleableComponents, setToggleableComponents] = useState<SNComponent[]>([])
  const [themesMenuOpen, setThemesMenuOpen] = useState(false)
  const [themesMenuPosition, setThemesMenuPosition] = useState({})
  const [defaultThemeOn, setDefaultThemeOn] = useState(false)

  const themesMenuRef = useRef<HTMLDivElement>(null)
  const themesButtonRef = useRef<HTMLButtonElement>(null)
  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const quickSettingsMenuRef = useRef<HTMLDivElement>(null)
  const defaultThemeButtonRef = useRef<HTMLButtonElement>(null)

  const mainRef = useRef<HTMLDivElement>(null)
  useCloseOnClickOutside(mainRef, () => {
    onClickOutside()
  })

  useEffect(() => {
    toggleFocusMode(focusModeEnabled)
  }, [focusModeEnabled])

  const reloadThemes = useCallback(() => {
    const themes = application.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme())
      .map((item) => {
        return {
          name: item.displayName,
          identifier: item.identifier,
          component: item,
        }
      }) as ThemeItem[]

    GetFeatures()
      .filter((feature) => feature.content_type === ContentType.Theme && !feature.layerable)
      .forEach((theme) => {
        if (themes.findIndex((item) => item.identifier === theme.identifier) === -1) {
          themes.push({
            name: theme.name as string,
            identifier: theme.identifier,
          })
        }
      })

    setThemes(themes.sort(sortThemes))

    setDefaultThemeOn(!themes.map((item) => item?.component).find((theme) => theme?.active && !theme.isLayerable()))
  }, [application])

  const reloadToggleableComponents = useCallback(() => {
    const toggleableComponents = application.items
      .getDisplayableComponents()
      .filter(
        (component) =>
          !component.isTheme() &&
          [ComponentArea.EditorStack].includes(component.area) &&
          component.identifier !== FeatureIdentifier.DeprecatedFoldersComponent,
      )

    setToggleableComponents(toggleableComponents)
  }, [application])

  useEffect(() => {
    if (!themes.length) {
      reloadThemes()
    }
  }, [reloadThemes, themes.length])

  useEffect(() => {
    const cleanupItemStream = application.streamItems(ContentType.Theme, () => {
      reloadThemes()
    })

    return () => {
      cleanupItemStream()
    }
  }, [application, reloadThemes])

  useEffect(() => {
    const cleanupItemStream = application.streamItems(ContentType.Component, () => {
      reloadToggleableComponents()
    })

    return () => {
      cleanupItemStream()
    }
  }, [application, reloadToggleableComponents])

  useEffect(() => {
    if (themesMenuOpen) {
      defaultThemeButtonRef.current?.focus()
    }
  }, [themesMenuOpen])

  useEffect(() => {
    prefsButtonRef.current?.focus()
  }, [])

  const [closeOnBlur] = useCloseOnBlur(themesMenuRef, setThemesMenuOpen)

  const toggleThemesMenu = useCallback(() => {
    if (!themesMenuOpen && themesButtonRef.current) {
      const themesButtonRect = themesButtonRef.current.getBoundingClientRect()
      setThemesMenuPosition({
        left: themesButtonRect.right,
        bottom: document.documentElement.clientHeight - themesButtonRect.bottom,
      })
      setThemesMenuOpen(true)
    } else {
      setThemesMenuOpen(false)
    }
  }, [themesMenuOpen])

  const openPreferences = useCallback(() => {
    closeQuickSettingsMenu()
    appState.preferences.openPreferences()
  }, [appState, closeQuickSettingsMenu])

  const toggleComponent = useCallback(
    (component: SNComponent) => {
      if (component.isTheme()) {
        application.mutator.toggleTheme(component).catch(console.error)
      } else {
        application.mutator.toggleComponent(component).catch(console.error)
      }
    },
    [application],
  )

  const handleBtnKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = useCallback(
    (event) => {
      switch (event.key) {
        case 'Escape':
          setThemesMenuOpen(false)
          themesButtonRef.current?.focus()
          break
        case 'ArrowRight':
          if (!themesMenuOpen) {
            toggleThemesMenu()
          }
      }
    },
    [themesMenuOpen, toggleThemesMenu],
  )

  const handleQuickSettingsKeyDown: KeyboardEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      quickSettingsKeyDownHandler(closeQuickSettingsMenu, event, quickSettingsMenuRef, themesMenuOpen)
    },
    [closeQuickSettingsMenu, themesMenuOpen],
  )

  const handlePanelKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback((event) => {
    themesMenuKeyDownHandler(event, themesMenuRef, setThemesMenuOpen, themesButtonRef)
  }, [])

  const toggleDefaultTheme = useCallback(() => {
    const activeTheme = themes.map((item) => item.component).find((theme) => theme?.active && !theme.isLayerable())
    if (activeTheme) {
      application.mutator.toggleTheme(activeTheme).catch(console.error)
    }
  }, [application, themes])

  return (
    <div ref={mainRef} className="sn-component">
      <div
        className={`sn-quick-settings-menu absolute ${MENU_CLASSNAME} ${
          shouldAnimateCloseMenu ? 'slide-up-animation' : 'sn-dropdown--animated'
        }`}
        ref={quickSettingsMenuRef}
        onKeyDown={handleQuickSettingsKeyDown}
      >
        <div className="px-3 mt-1 mb-2 font-semibold color-text uppercase">Quick Settings</div>
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
            <div className="px-3 my-1 font-semibold color-text uppercase">Themes</div>
            <button
              className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
              onClick={toggleDefaultTheme}
              onBlur={closeOnBlur}
              ref={defaultThemeButtonRef}
            >
              <div className={`pseudo-radio-btn ${defaultThemeOn ? 'pseudo-radio-btn--checked' : ''} mr-2`}></div>
              Default
            </button>
            {themes.map((theme) => (
              <ThemesMenuButton
                item={theme}
                application={application}
                key={theme.component?.uuid ?? theme.identifier}
                onBlur={closeOnBlur}
              />
            ))}
          </DisclosurePanel>
        </Disclosure>
        {toggleableComponents.map((component) => (
          <button
            className="sn-dropdown-item justify-between focus:bg-info-backdrop focus:shadow-none"
            onClick={() => {
              toggleComponent(component)
            }}
            key={component.uuid}
          >
            <div className="flex items-center">
              <Icon type="window" className="color-neutral mr-2" />
              {component.displayName}
            </div>
            <Switch checked={component.active} className="px-0" />
          </button>
        ))}
        <FocusModeSwitch
          application={application}
          onToggle={setFocusModeEnabled}
          onClose={closeQuickSettingsMenu}
          isEnabled={focusModeEnabled}
        />
        <div className="h-1px my-2 bg-border"></div>
        <button
          className="sn-dropdown-item focus:bg-info-backdrop focus:shadow-none"
          onClick={openPreferences}
          ref={prefsButtonRef}
        >
          <Icon type="more" className="color-neutral mr-2" />
          Open Preferences
        </button>
      </div>
    </div>
  )
}

export default observer(QuickSettingsMenu)
