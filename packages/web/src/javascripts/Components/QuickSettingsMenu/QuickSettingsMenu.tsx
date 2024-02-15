import {
  ComponentArea,
  ComponentInterface,
  UIFeature,
  ContentType,
  NativeFeatureIdentifier,
  PreferencesServiceEvent,
  ThemeFeatureDescription,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import Icon from '@/Components/Icon/Icon'
import FocusModeSwitch from './FocusModeSwitch'
import ThemesMenuButton from './ThemesMenuButton'
import { sortThemes } from '@/Utils/SortThemes'
import PanelSettingsSection from './PanelSettingsSection'
import Menu from '../Menu/Menu'
import MenuSwitchButtonItem from '../Menu/MenuSwitchButtonItem'
import MenuRadioButtonItem from '../Menu/MenuRadioButtonItem'
import { useApplication } from '../ApplicationProvider'
import { GetAllThemesUseCase } from '@standardnotes/ui-services'
import MenuSection from '../Menu/MenuSection'

type MenuProps = {
  closeMenu: () => void
}

const QuickSettingsMenu: FunctionComponent<MenuProps> = ({ closeMenu }) => {
  const application = useApplication()

  const { focusModeEnabled, setFocusModeEnabled } = application.paneController
  const [themes, setThemes] = useState<UIFeature<ThemeFeatureDescription>[]>([])
  const [editorStackComponents, setEditorStackComponents] = useState<ComponentInterface[]>([])

  const activeThemes = application.componentManager.getActiveThemes()
  const hasNonLayerableActiveTheme = activeThemes.find((theme) => !theme.layerable)
  const defaultThemeOn = !hasNonLayerableActiveTheme

  const prefsButtonRef = useRef<HTMLButtonElement>(null)
  const defaultThemeButtonRef = useRef<HTMLButtonElement>(null)

  const reloadThemes = useCallback(() => {
    const usecase = new GetAllThemesUseCase(application.items)
    const { thirdParty, native } = usecase.execute({ excludeLayerable: false })
    setThemes([...thirdParty, ...native].sort(sortThemes))
  }, [application])

  const reloadEditorStackComponents = useCallback(() => {
    const toggleableComponents = application.items
      .getDisplayableComponents()
      .filter(
        (component) =>
          !component.isTheme() &&
          [ComponentArea.EditorStack].includes(component.area) &&
          component.identifier !== NativeFeatureIdentifier.TYPES.DeprecatedFoldersComponent,
      )

    setEditorStackComponents(toggleableComponents)
  }, [application])

  useEffect(() => {
    if (!themes.length) {
      reloadThemes()
    }
  }, [reloadThemes, themes.length])

  useEffect(() => {
    const cleanupItemStream = application.items.streamItems(ContentType.TYPES.Theme, () => {
      reloadThemes()
    })

    return () => {
      cleanupItemStream()
    }
  }, [application, reloadThemes])

  useEffect(() => {
    return application.preferences.addEventObserver((event) => {
      if (event === PreferencesServiceEvent.LocalPreferencesChanged) {
        reloadThemes()
      }
    })
  }, [application, reloadThemes])

  useEffect(() => {
    const cleanupItemStream = application.items.streamItems(ContentType.TYPES.Component, () => {
      reloadEditorStackComponents()
    })

    return () => {
      cleanupItemStream()
    }
  }, [application, reloadEditorStackComponents])

  useEffect(() => {
    prefsButtonRef.current?.focus()
  }, [])

  const toggleEditorStackComponent = useCallback(
    (component: ComponentInterface) => {
      void application.componentManager.toggleComponent(component)
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
    <Menu a11yLabel="Quick settings menu">
      {editorStackComponents.length > 0 && (
        <MenuSection title="Tools">
          {editorStackComponents.map((component) => (
            <MenuSwitchButtonItem
              onChange={() => {
                toggleEditorStackComponent(component)
              }}
              checked={application.componentManager.isComponentActive(component)}
              key={component.uuid}
            >
              <Icon type="window" className="mr-2 text-neutral" />
              {component.displayName}
            </MenuSwitchButtonItem>
          ))}
        </MenuSection>
      )}
      <MenuSection title="Appearance">
        <MenuRadioButtonItem checked={defaultThemeOn} onClick={toggleDefaultTheme} ref={defaultThemeButtonRef}>
          Default
        </MenuRadioButtonItem>
        {themes.map((theme) => (
          <ThemesMenuButton uiFeature={theme} key={theme.uniqueIdentifier.value} />
        ))}
      </MenuSection>

      <FocusModeSwitch
        application={application}
        onToggle={setFocusModeEnabled}
        onClose={closeMenu}
        isEnabled={focusModeEnabled}
      />
      <PanelSettingsSection />
    </Menu>
  )
}

export default observer(QuickSettingsMenu)
