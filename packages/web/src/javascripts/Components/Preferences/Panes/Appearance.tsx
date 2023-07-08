import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { WebApplication } from '@/Application/WebApplication'
import {
  ContentType,
  FeatureIdentifier,
  PrefKey,
  GetFeatures,
  FindNativeFeature,
  FeatureStatus,
  naturalSort,
  PrefDefaults,
  ThemeInterface,
} from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect, useState } from 'react'
import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../PreferencesComponents/PreferencesSegment'
import { PremiumFeatureIconName } from '@/Components/Icon/PremiumFeatureIcon'
import EditorAppearance from './Appearance/EditorAppearance'
import { GetAllThemesUseCase } from '@/Components/QuickSettingsMenu/GetAllThemesUseCase'

type Props = {
  application: WebApplication
}

const Appearance: FunctionComponent<Props> = ({ application }) => {
  const premiumModal = usePremiumModal()

  const [themeItems, setThemeItems] = useState<DropdownItem[]>([])
  const [autoLightTheme, setAutoLightTheme] = useState<string>(() =>
    application.getPreference(PrefKey.AutoLightThemeIdentifier, PrefDefaults[PrefKey.AutoLightThemeIdentifier]),
  )
  const [autoDarkTheme, setAutoDarkTheme] = useState<string>(() =>
    application.getPreference(PrefKey.AutoDarkThemeIdentifier, PrefDefaults[PrefKey.AutoDarkThemeIdentifier]),
  )
  const [useDeviceSettings, setUseDeviceSettings] = useState(() =>
    application.getPreference(PrefKey.UseSystemColorScheme, PrefDefaults[PrefKey.UseSystemColorScheme]),
  )

  useEffect(() => {
    const usecase = new GetAllThemesUseCase(application.items)
    const themesAsItems: DropdownItem[] = application.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme() && !(component as ThemeInterface).layerable)
      .filter((theme) => !FindNativeFeature(theme.identifier))
      .map((theme) => {
        return {
          label: theme.name,
          value: theme.identifier as string,
        }
      })

    GetFeatures()
      .filter((feature) => feature.content_type === ContentType.Theme && !feature.layerable)
      .forEach((theme) => {
        themesAsItems.push({
          label: theme.name as string,
          value: theme.identifier,
          icon:
            application.features.getFeatureStatus(theme.identifier) !== FeatureStatus.Entitled
              ? PremiumFeatureIconName
              : undefined,
        })
      })

    themesAsItems.unshift({
      label: 'Default',
      value: 'Default',
    })

    setThemeItems(naturalSort(themesAsItems, 'label'))
  }, [application])

  const toggleUseDeviceSettings = () => {
    application.setPreference(PrefKey.UseSystemColorScheme, !useDeviceSettings).catch(console.error)
    if (!application.getPreference(PrefKey.AutoLightThemeIdentifier)) {
      application
        .setPreference(PrefKey.AutoLightThemeIdentifier, autoLightTheme as FeatureIdentifier)
        .catch(console.error)
    }
    if (!application.getPreference(PrefKey.AutoDarkThemeIdentifier)) {
      application
        .setPreference(PrefKey.AutoDarkThemeIdentifier, autoDarkTheme as FeatureIdentifier)
        .catch(console.error)
    }
    setUseDeviceSettings(!useDeviceSettings)
  }

  const changeAutoLightTheme = (value: string) => {
    const item = themeItems.find((item) => item.value === value)
    if (item && item.icon === PremiumFeatureIconName) {
      premiumModal.activate(`${item.label} theme`)
      return
    }
    application.setPreference(PrefKey.AutoLightThemeIdentifier, value as FeatureIdentifier).catch(console.error)
    setAutoLightTheme(value)
  }

  const changeAutoDarkTheme = (value: string) => {
    const item = themeItems.find((item) => item.value === value)
    if (item && item.icon === PremiumFeatureIconName) {
      premiumModal.activate(`${item.label} theme`)
      return
    }
    application.setPreference(PrefKey.AutoDarkThemeIdentifier, value as FeatureIdentifier).catch(console.error)
    setAutoDarkTheme(value)
  }

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Themes</Title>
          <div className="mt-2">
            <div className="flex justify-between gap-2 md:items-center">
              <div className="flex flex-col">
                <Subtitle>Use system color scheme</Subtitle>
                <Text>Automatically change active theme based on your system settings.</Text>
              </div>
              <Switch onChange={toggleUseDeviceSettings} checked={useDeviceSettings} />
            </div>
            <HorizontalSeparator classes="my-4" />
            <div>
              <Subtitle>Automatic Light Theme</Subtitle>
              <Text>Theme to be used for system light mode:</Text>
              <div className="mt-2">
                <Dropdown
                  label="Select the automatic light theme"
                  items={themeItems}
                  value={autoLightTheme}
                  onChange={changeAutoLightTheme}
                  disabled={!useDeviceSettings}
                />
              </div>
            </div>
            <HorizontalSeparator classes="my-4" />
            <div>
              <Subtitle>Automatic Dark Theme</Subtitle>
              <Text>Theme to be used for system dark mode:</Text>
              <div className="mt-2">
                <Dropdown
                  label="Select the automatic dark theme"
                  items={themeItems}
                  value={autoDarkTheme}
                  onChange={changeAutoDarkTheme}
                  disabled={!useDeviceSettings}
                />
              </div>
            </div>
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
      <EditorAppearance application={application} />
    </PreferencesPane>
  )
}

export default observer(Appearance)
