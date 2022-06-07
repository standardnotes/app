import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Switch from '@/Components/Switch/Switch'
import { WebApplication } from '@/Application/Application'
import { ContentType, FeatureIdentifier, FeatureStatus, PrefKey, GetFeatures, SNTheme } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FunctionComponent, useEffect, useState } from 'react'
import { Subtitle, Title, Text } from '@/Components/Preferences/PreferencesComponents/Content'
import { sortThemes } from '@/Utils/SortThemes'
import PreferencesPane from '../PreferencesComponents/PreferencesPane'
import PreferencesGroup from '../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../PreferencesComponents/PreferencesSegment'

type Props = {
  application: WebApplication
}

const Appearance: FunctionComponent<Props> = ({ application }) => {
  const premiumModal = usePremiumModal()
  const isEntitledToMidnightTheme =
    application.features.getFeatureStatus(FeatureIdentifier.MidnightTheme) === FeatureStatus.Entitled

  const [themeItems, setThemeItems] = useState<DropdownItem[]>([])
  const [autoLightTheme, setAutoLightTheme] = useState<string>(
    () => application.getPreference(PrefKey.AutoLightThemeIdentifier, 'Default') as string,
  )
  const [autoDarkTheme, setAutoDarkTheme] = useState<string>(
    () =>
      application.getPreference(
        PrefKey.AutoDarkThemeIdentifier,
        isEntitledToMidnightTheme ? FeatureIdentifier.MidnightTheme : 'Default',
      ) as string,
  )
  const [useDeviceSettings, setUseDeviceSettings] = useState(
    () => application.getPreference(PrefKey.UseSystemColorScheme, false) as boolean,
  )

  useEffect(() => {
    const themesAsItems: DropdownItem[] = application.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme())
      .filter((component) => !(component as SNTheme).isLayerable())
      .sort(sortThemes)
      .map((theme) => {
        return {
          label: theme.name,
          value: theme.identifier as string,
        }
      })

    GetFeatures()
      .filter((feature) => feature.content_type === ContentType.Theme && !feature.layerable)
      .forEach((theme) => {
        if (themesAsItems.findIndex((item) => item.value === theme.identifier) === -1) {
          themesAsItems.push({
            label: theme.name as string,
            value: theme.identifier,
            icon: 'premium-feature',
          })
        }
      })

    themesAsItems.unshift({
      label: 'Default',
      value: 'Default',
    })

    setThemeItems(themesAsItems)
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

  const changeAutoLightTheme = (value: string, item: DropdownItem) => {
    if (item.icon === 'premium-feature') {
      premiumModal.activate(`${item.label} theme`)
    } else {
      application.setPreference(PrefKey.AutoLightThemeIdentifier, value as FeatureIdentifier).catch(console.error)
      setAutoLightTheme(value)
    }
  }

  const changeAutoDarkTheme = (value: string, item: DropdownItem) => {
    if (item.icon === 'premium-feature') {
      premiumModal.activate(`${item.label} theme`)
    } else {
      application.setPreference(PrefKey.AutoDarkThemeIdentifier, value as FeatureIdentifier).catch(console.error)
      setAutoDarkTheme(value)
    }
  }

  return (
    <PreferencesPane>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Themes</Title>
          <div className="mt-2">
            <div className="flex items-center justify-between">
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
                  id="auto-light-theme-dropdown"
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
                  id="auto-dark-theme-dropdown"
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
    </PreferencesPane>
  )
}

export default observer(Appearance)
