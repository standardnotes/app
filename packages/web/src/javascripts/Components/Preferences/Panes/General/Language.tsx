import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { WebApplication } from '@/Application/WebApplication'
import { isDesktopApplication } from '@/Utils'
import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Switch from '@/Components/Switch/Switch'
import { NativeFeatureIdentifier } from '@standardnotes/snjs'
import { c } from 'ttag'

export const LANGUAGE_PREFERENCES_SECTION_ID = 'preferences-section-language'

/** Lets the Labs switch paint before the localization reload. */
const LOCALIZATION_TOGGLE_RELOAD_DELAY_MS = 200

type Props = {
  application: WebApplication
}

const Language: FunctionComponent<Props> = ({ application }) => {
  const [labsSwitchChecked, setLabsSwitchChecked] = useState(() =>
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
    const isEnabled = application.featuresController.isLocalizationEnabled()
    setLabsSwitchChecked(isEnabled)

    window.setTimeout(() => {
      if (isEnabled) {
        void application.localizationController.enableLocalization()
      } else {
        void application.localizationController.disableLocalization()
      }
    }, LOCALIZATION_TOGGLE_RELOAD_DELAY_MS)
  }, [application])

  const showLanguageDropdown = labsSwitchChecked && localeItems.length > 0
  const usesOsLanguage = isDesktopApplication() || application.isNativeMobileWeb()

  const onLocaleChange = useCallback(
    (value: string) => {
      void application.localizationController.changeLocaleAndReload(value)
    },
    [application],
  )

  const { preferencesController } = application

  useEffect(() => {
    if (!preferencesController.isOpen || preferencesController.currentPane !== 'general') {
      return
    }

    if (preferencesController.scrollToPreferencesSectionId !== LANGUAGE_PREFERENCES_SECTION_ID) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(LANGUAGE_PREFERENCES_SECTION_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      preferencesController.clearPreferencesSectionScrollTarget()
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [
    preferencesController,
    preferencesController.isOpen,
    preferencesController.currentPane,
    preferencesController.scrollToPreferencesSectionId,
  ])

  return (
    <PreferencesGroup id={LANGUAGE_PREFERENCES_SECTION_ID}>
      <PreferencesSegment>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <Title>{c('B6.Preferences.General.Language.Title').t`Language Settings`}</Title>
            <Pill style={'success'}>{c('B6.Preferences.General.Label').t`Labs`}</Pill>
          </div>
          <Switch onChange={toggle} checked={labsSwitchChecked} />
        </div>

        <Text>
          {usesOsLanguage
            ? c('B6.Preferences.General.Language.Info')
                .t`Use the app in your preferred language and customize date and time formats. Your OS language is used when no preference is set.`
            : c('B6.Preferences.General.Language.Info')
                .t`Use the app in your preferred language and customize date and time formats. Your browser language is used when no preference is set.`}
        </Text>

        {showLanguageDropdown && (
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
