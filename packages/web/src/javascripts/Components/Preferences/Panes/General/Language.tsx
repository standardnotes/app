import Dropdown from '@/Components/Dropdown/Dropdown'
import { DropdownItem } from '@/Components/Dropdown/DropdownItem'
import { Pill, Subtitle, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'
import { WebApplication } from '@/Application/WebApplication'
import { isDesktopApplication } from '@/Utils'
import { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import Switch from '@/Components/Switch/Switch'
import { c } from 'ttag'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@standardnotes/utils'

const LABS_SWITCH_ANIMATION_MS = 200
const SPOTLIGHT_DURATION_MS = 2000

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

  const isTogglingRef = useRef(false)
  const [isToggling, setIsToggling] = useState(false)

  const toggle = useCallback(() => {
    if (isTogglingRef.current) {
      return
    }
    isTogglingRef.current = true
    setIsToggling(true)

    setLabsSwitchChecked((checked) => !checked)

    const switchAnimation = new Promise<void>((resolve) => {
      window.setTimeout(resolve, LABS_SWITCH_ANIMATION_MS)
    })
    void application.localizationController.toggleLocalization(switchAnimation)
  }, [application])

  const showLanguageDropdown = labsSwitchChecked && localeItems.length > 0
  const showLanguageOptionsError = labsSwitchChecked && localizationStore.availableLocalesFailedToLoad
  const usesOsLanguage = isDesktopApplication() || application.isNativeMobileWeb()

  const [switchingToLocale, setSwitchingToLocale] = useState<string>()

  const onLocaleChange = useCallback(
    async (value: string) => {
      setSwitchingToLocale(value)
      const isReloading = await application.localizationController.changeLocaleAndReload(value)
      if (!isReloading) {
        setSwitchingToLocale(undefined)
      }
    },
    [application],
  )

  const { preferencesController } = application

  const [isSpotlighted, setIsSpotlighted] = useState(false)

  useEffect(() => {
    if (!isSpotlighted) {
      return
    }

    const timeout = window.setTimeout(() => setIsSpotlighted(false), SPOTLIGHT_DURATION_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [isSpotlighted])

  useEffect(() => {
    if (!preferencesController.isOpen || preferencesController.currentPane !== 'general') {
      return
    }

    if (preferencesController.scrollToPreferencesSectionId !== ElementIds.LanguagePreferencesSection) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      document
        .getElementById(ElementIds.LanguagePreferencesSection)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsSpotlighted(true)
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
    <PreferencesGroup
      id={ElementIds.LanguagePreferencesSection}
      className={classNames(
        'ring-2 ring-inset transition-shadow duration-700 motion-reduce:transition-none',
        isSpotlighted ? 'ring-info' : 'ring-transparent',
      )}
    >
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
                .t`Use the app in your preferred language. Your OS language is used when no preference is set.`
            : c('B6.Preferences.General.Language.Info')
                .t`Use the app in your preferred language. Your browser language is used when no preference is set.`}
        </Text>

        {showLanguageDropdown && (
          <div className="mt-4">
            <Subtitle>{c('B6.Preferences.General.Language.Subtitle').t`App language`}</Subtitle>
            <div className="mt-2">
              <Dropdown
                label={c('B6.Preferences.General.Language.Action').t`Select the app language`}
                items={localeItems}
                value={switchingToLocale ?? localizationStore.currentLocale}
                onChange={onLocaleChange}
                disabled={isToggling || switchingToLocale !== undefined}
              />
            </div>
          </div>
        )}

        {showLanguageOptionsError && (
          <div className="mt-4 text-danger">
            {c('B6.Preferences.General.Language.Error')
              .t`Failed to load language options. Please reload the app and try again.`}
          </div>
        )}
      </PreferencesSegment>
    </PreferencesGroup>
  )
}

export default observer(Language)
