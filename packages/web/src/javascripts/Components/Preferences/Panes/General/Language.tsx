import { Pill, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { FunctionComponent, useCallback, useState } from 'react'
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

  const toggle = useCallback(() => {
    application.features.toggleExperimentalFeature(NativeFeatureIdentifier.TYPES.Localization)
    setLocalizationEnabled(application.featuresController.isLocalizationEnabled())
  }, [application])

  return (
    <PreferencesGroup>
      <PreferencesSegment>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Title>{c('B6.Preferences.General.Language.Title').t`Language`}</Title>
            <Pill style={'success'}>{c('B6.Preferences.General.Label').t`Labs`}</Pill>
          </div>
          <Switch onChange={toggle} checked={localizationEnabled} />
        </div>

        <Text>
          {c('B6.Preferences.General.Language.Info')
            .t`Use the app in your preferred language and customize date and time formats. Your browser language is used when no preference is set.`}
        </Text>
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default Language
