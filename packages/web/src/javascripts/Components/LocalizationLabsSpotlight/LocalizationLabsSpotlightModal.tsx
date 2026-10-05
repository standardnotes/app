import AlertDialog from '@/Components/AlertDialog/AlertDialog'
import Button from '@/Components/Button/Button'
import Icon from '@/Components/Icon/Icon'
import { Pill, Text, Title } from '@/Components/Preferences/PreferencesComponents/Content'
import { WebApplication } from '@/Application/WebApplication'
import { isDesktopApplication } from '@/Utils'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { c } from 'ttag'

type Props = {
  application: WebApplication
}

const LocalizationLabsSpotlightModal = ({ application }: Props) => {
  const { localizationController } = application
  const usesOsLanguage = isDesktopApplication() || application.isNativeMobileWeb()

  const dismiss = useCallback(() => {
    localizationController.dismissLabsSpotlight()
  }, [localizationController])

  const openLanguageSettings = useCallback(() => {
    localizationController.openLanguageSettingsFromLabsSpotlight()
  }, [localizationController])

  if (!localizationController.labsSpotlightReady || !localizationController.labsSpotlightOpen) {
    return null
  }

  return (
    <AlertDialog closeDialog={dismiss}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-2">
          <Title className="mb-0">{c('B6.Preferences.General.Language.Title').t`Language Settings`}</Title>
          <Pill style={'success'}>{c('B6.Preferences.General.Label').t`Labs`}</Pill>
        </div>
        <button
          type="button"
          className="rounded p-1 font-bold hover:bg-contrast"
          onClick={dismiss}
          aria-label={c('B2.NavSharedUI.Action').t`Close`}
        >
          <Icon type="close" />
        </button>
      </div>
      <Text className="mt-3">
        {usesOsLanguage
          ? c('B6.Preferences.General.Language.Spotlight.Info')
              .t`You can now use the app in your preferred language. Turn on this Labs feature in Settings → General → Language. Your OS language is used when no preference is set.`
          : c('B6.Preferences.General.Language.Spotlight.Info')
              .t`You can now use the app in your preferred language. Turn on this Labs feature in Settings → General → Language. Your browser language is used when no preference is set.`}
      </Text>
      <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <Button onClick={dismiss}>{c('B6.Preferences.General.Language.Spotlight.ActionDismiss').t`Not now`}</Button>
        <Button primary onClick={openLanguageSettings}>
          {c('B6.Preferences.General.Language.Spotlight.ActionOpen').t`Open language settings`}
        </Button>
      </div>
    </AlertDialog>
  )
}

LocalizationLabsSpotlightModal.displayName = 'LocalizationLabsSpotlightModal'

export default observer(LocalizationLabsSpotlightModal)
