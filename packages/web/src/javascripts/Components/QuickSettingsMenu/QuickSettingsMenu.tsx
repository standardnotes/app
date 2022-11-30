import { WebApplication } from '@/Application/Application'
import {
  ApplicationEvent,
  ComponentArea,
  ContentType,
  FeatureIdentifier,
  GetFeatures,
  PrefKey,
  SNComponent,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import FocusModeSwitch from './FocusModeSwitch'
import ThemesMenuButton from './ThemesMenuButton'
import { ThemeItem } from './ThemeItem'
import { sortThemes } from '@/Utils/SortThemes'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import PanelSettingsSection from './PanelSettingsSection'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import Menu from '../Menu/Menu'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'

type MenuProps = {
  quickSettingsMenuController: QuickSettingsController
  application: WebApplication
}

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ application, quickSettingsMenuController }) => {
  const { focusModeEnabled, setFocusModeEnabled } = application.paneController
  const { closeQuickSettingsMenu } = quickSettingsMenuController
  const [themes, setThemes] = useState<ThemeItem[]>([])
  const [toggleableComponents, setToggleableComponents] = useState<SNComponent[]>([])

  const [isDarkModeOn, setDarkModeOn] = useState(() =>
    application.getPreference(PrefKey.DarkMode, PrefDefaults[PrefKey.DarkMode]),
  )
  const defaultThemeOn =
    !themes.map((item) => item?.component).find((theme) => theme?.active && !theme.isLayerable()) && !isDarkModeOn

  useEffect(() => {
    const removeObserver = application.addEventObserver(async (event) => {
      if (event !== ApplicationEvent.PreferencesChanged) {
        return
      }

      const isDarkModeOn = application.getPreference(PrefKey.DarkMode, PrefDefaults[PrefKey.DarkMode])
      setDarkModeOn(isDarkModeOn)
    })

    return removeObserver
  }, [application])

  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const defaultThemeButtonRef = useRef<HTMLButtonElement>(null)

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
    prefsButtonRef.current?.focus()
  }, [])

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

  const deactivateAnyNonLayerableTheme = useCallback(() => {
    const activeTheme = themes.map((item) => item.component).find((theme) => theme?.active && !theme.isLayerable())
    if (activeTheme) {
      application.mutator.toggleTheme(activeTheme).catch(console.error)
    }
  }, [application, themes])

  const toggleDefaultTheme = useCallback(() => {
    deactivateAnyNonLayerableTheme()
    void application.setPreference(PrefKey.DarkMode, false)
  }, [application, deactivateAnyNonLayerableTheme])

  return (
    <Menu a11yLabel="Quick settings menu" isOpen>
      {toggleableComponents.length > 0 && (
        <>
          <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Tools</div>
          {toggleableComponents.map((component) => (
            <MenuSwitchButtonItem
              onChange={() => {
                toggleComponent(component)
              }}
              checked={component.active}
              key={component.uuid}
            >
              <Icon type="window" className="mr-2 text-neutral" />
              {component.displayName}
            </MenuSwitchButtonItem>
          ))}
          <HorizontalSeparator classes="my-2" />
        </>
      )}
      <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Appearance</div>
      <MenuRadioButtonItem checked={defaultThemeOn} onClick={toggleDefaultTheme} ref={defaultThemeButtonRef}>
        Default
      </MenuRadioButtonItem>
      {themes.map((theme) => (
        <ThemesMenuButton item={theme} application={application} key={theme.component?.uuid ?? theme.identifier} />
      ))}
      <HorizontalSeparator classes="my-2" />
      <FocusModeSwitch
        application={application}
        onToggle={setFocusModeEnabled}
        onClose={closeQuickSettingsMenu}
        isEnabled={focusModeEnabled}
      />
      <PanelSettingsSection />
    </Menu>
  )
}

export default observer(QuickSettingsMenu)
