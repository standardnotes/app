import { WebApplication } from '@/Application/Application'
import { ComponentArea, ContentType, FeatureIdentifier, GetFeatures, SNComponent } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import Switch from '@/Components/Switch/Switch'
import FocusModeSwitch from './FocusModeSwitch'
import ThemesMenuButton from './ThemesMenuButton'
import { ThemeItem } from './ThemeItem'
import { sortThemes } from '@/Utils/SortThemes'
import RadioIndicator from '../RadioIndicator/RadioIndicator'
import HorizontalSeparator from '../Shared/HorizontalSeparator'
import { QuickSettingsController } from '@/Controllers/QuickSettingsController'
import PanelSettingsSection from './PanelSettingsSection'

const focusModeAnimationDuration = 1255

type MenuProps = {
  quickSettingsMenuController: QuickSettingsController
  application: WebApplication
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

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ application, quickSettingsMenuController }) => {
  const { closeQuickSettingsMenu, focusModeEnabled, setFocusModeEnabled } = quickSettingsMenuController
  const [themes, setThemes] = useState<ThemeItem[]>([])
  const [toggleableComponents, setToggleableComponents] = useState<SNComponent[]>([])
  const [defaultThemeOn, setDefaultThemeOn] = useState(false)

  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const defaultThemeButtonRef = useRef<HTMLButtonElement>(null)

  const mainRef = useRef<HTMLDivElement>(null)

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

  const toggleDefaultTheme = useCallback(() => {
    const activeTheme = themes.map((item) => item.component).find((theme) => theme?.active && !theme.isLayerable())
    if (activeTheme) {
      application.mutator.toggleTheme(activeTheme).catch(console.error)
    }
  }, [application, themes])

  return (
    <div ref={mainRef}>
      <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Themes</div>
      <button
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none"
        onClick={toggleDefaultTheme}
        ref={defaultThemeButtonRef}
      >
        <RadioIndicator checked={defaultThemeOn} className="mr-2" />
        Default
      </button>
      {themes.map((theme) => (
        <ThemesMenuButton item={theme} application={application} key={theme.component?.uuid ?? theme.identifier} />
      ))}
      <HorizontalSeparator classes="my-2" />
      <div className="my-1 px-3 text-sm font-semibold uppercase text-text">Tools</div>
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
      <PanelSettingsSection application={application} />
    </div>
  )
}

export default observer(QuickSettingsMenu)
