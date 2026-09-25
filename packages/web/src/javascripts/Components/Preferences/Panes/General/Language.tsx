import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Switch from '@/Components/Switch/Switch'
import { NativeFeatureIdentifier } from '@standardnotes/snjs'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const Language: FunctionComponent<Props> = ({ application }) => {
  const [localizationEnabled, setLocalizationEnabled] = useState(() =>
    application.featuresController.isLocalizationEnabled(),
  )

  const localeItems: DropdownItem[] = Object.entries(localizationStore.availableLocales)
    .sort(([, leftLabel], [, rightLabel]) => leftLabel.localeCompare(rightLabel))
    .map(([localeCode, label]) => ({
      label,
      value: localeCode,
    }))

  const toggle = useCallback(() => {
    application.features.toggleExperimentalFeature(NativeFeatureIdentifier.TYPES.Localization)
    setLocalizationEnabled(application.featuresController.isLocalizationEnabled())
    void application.localizationController.reinitialize()
  }, [application])

  const onLocaleChange = useCallback(
    (value: string) => {
      void application.localizationController.changeLocaleAndReload(value)
    },
    [application],
  )

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Title>{c('B6.Preferences.General.Language.Title').t`Language Settings`}</Title>
            <Pill style={'success'}>{c('B6.Preferences.General.Label').t`Labs`}</Pill>
          </div>
          <Switch onChange={toggle} checked={localizationEnabled} />
        </div>

        <Text>
          {c('B6.Preferences.General.Language.Info')
            .t`Use the app in your preferred language and customize date and time formats. Your browser language is used when no preference is set.`}
        </Text>

        {localizationEnabled && (
          <div className="mt-4">
            <Subtitle>{c('B6.Preferences.General.Language.Subtitle').t`App language`}</Subtitle>
            <div className="mt-2">
              <Dropdown
                label={c('B6.Preferences.General.Language.Action').t`Select the app language`}
                items={localeItems}
                value={localizationStore.currentLocale}
                onChange={onLocaleChange}
              />
            </div>
          </div>
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Language)
