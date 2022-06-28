import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
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
import RadioIndicator from '../RadioIndicator/RadioIndicator'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

const focusModeAnimationDuration = 1255

type MenuProps = {
  viewControllerManager: ViewControllerManager
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

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ application, viewControllerManager, onClickOutside }) => {
  const { closeQuickSettingsMenu, shouldAnimateCloseMenu, focusModeEnabled, setFocusModeEnabled } =
    viewControllerManager.quickSettingsMenuController
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
    viewControllerManager.preferencesController.openPreferences()
  }, [viewControllerManager, closeQuickSettingsMenu])

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
        className={`max-h-120 absolute bottom-full left-0 z-footer-bar-item-panel flex min-w-80 max-w-xs cursor-auto flex-col overflow-y-auto rounded bg-default py-2 shadow-main ${
          shouldAnimateCloseMenu ? 'slide-up-animation' : 'slide-down-animation transition-transform duration-150'
        }`}
        ref={quickSettingsMenuRef}
        onKeyDown={handleQuickSettingsKeyDown}
      >
        <div className="mt-1 mb-2 px-3 text-sm font-semibold uppercase text-text">Quick Settings</div>
        <Disclosure open={themesMenuOpen} onChange={toggleThemesMenu}>
          <DisclosureButton
            onKeyDown={handleBtnKeyDown}
            onBlur={closeOnBlur}
            ref={themesButtonRef}
            className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          >
            <div className="flex items-center">
              <Icon type="themes" className="mr-2 text-neutral" />
              Themes
            </div>
            <Icon type="chevron-right" className="text-neutral" />
          </DisclosureButton>
          <DisclosurePanel
            onBlur={closeOnBlur}
            ref={themesMenuRef}
            onKeyDown={handlePanelKeyDown}
            style={{
              ...themesMenuPosition,
            }}
            className={`${
              themesMenuOpen ? 'flex' : 'hidden'
            } max-h-120 slide-down-animation fixed min-w-80 max-w-xs flex-col overflow-y-auto rounded bg-default py-2 shadow-main transition-transform duration-150`}
          >
            <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Themes</div>
            <button
              className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
              onClick={toggleDefaultTheme}
              onBlur={closeOnBlur}
              ref={defaultThemeButtonRef}
            >
              <RadioIndicator checked={defaultThemeOn} className="mr-2" />
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
            className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
            onClick={() => {
              toggleComponent(component)
            }}
            key={component.uuid}
          >
            <div className="flex items-center">
              <Icon type="window" className="mr-2 text-neutral" />
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
        <HorizontalSeparator classes="my-2" />
        <button
          className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
          onClick={openPreferences}
          ref={prefsButtonRef}
        >
          <Icon type="more" className="mr-2 text-neutral" />
          Open Preferences
        </button>
      </div>
    </div>
  )
}

export default observer(QuickSettingsMenu)
