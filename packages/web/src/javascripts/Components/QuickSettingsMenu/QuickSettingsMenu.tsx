import {
  ComponentArea,
  ComponentInterface,
  ContentType,
  FeatureIdentifier,
  ThemeInterface,
  getComponentOrNativeFeatureUniqueIdentifier,
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
import Menu from '../Menu/Menu'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { useApplication } from '../ApplicationProvider'
import { GetAllThemesUseCase } from './GetAllThemesUseCase'

type MenuProps = {
  quickSettingsMenuController: QuickSettingsController
}

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ quickSettingsMenuController }) => {
  const application = useApplication()

  const { focusModeEnabled, setFocusModeEnabled } = application.paneController
  const { closeQuickSettingsMenu } = quickSettingsMenuController
  const [thirdPartyThemes, setThirdPartyThemes] = useState<ThemeItem[]>([])
  const [toggleableComponents, setToggleableComponents] = useState<ComponentInterface[]>([])

  const activeThemes = application.componentManager.getActiveThemes()
  const hasNonLayerableActiveTheme = activeThemes.find((theme) => !theme.layerable)
  const defaultThemeOn = !hasNonLayerableActiveTheme

  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const defaultThemeButtonRef = useRef<HTMLButtonElement>(null)

  const reloadThemes = useCallback(() => {
    const usecase = new GetAllThemesUseCase(application.items)
    const { thirdParty, native } = usecase.execute()
    setThirdPartyThemes([...thirdParty, ...native].sort(sortThemes))
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
    if (!thirdPartyThemes.length) {
      reloadThemes()
    }
  }, [reloadThemes, thirdPartyThemes.length])

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
    (component: ComponentInterface) => {
      if (component.isTheme()) {
        application.componentManager.toggleTheme(component as ThemeInterface).catch(console.error)
      } else {
        application.componentManager.toggleComponent(component).catch(console.error)
      }
    },
    [application],
  )

  const deactivateAnyNonLayerableTheme = useCallback(() => {
    const nonLayerableActiveTheme = application.componentManager.getActiveThemes().find((theme) => !theme.layerable)
    if (nonLayerableActiveTheme) {
      void application.componentManager.toggleTheme(nonLayerableActiveTheme)
    }
  }, [application])

  const toggleDefaultTheme = useCallback(() => {
    deactivateAnyNonLayerableTheme()
  }, [deactivateAnyNonLayerableTheme])

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
              checked={application.componentManager.isComponentActive(component)}
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
      {thirdPartyThemes.map((theme) => (
        <ThemesMenuButton
          item={theme}
          key={getComponentOrNativeFeatureUniqueIdentifier(theme.componentOrNativeTheme)}
        />
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
