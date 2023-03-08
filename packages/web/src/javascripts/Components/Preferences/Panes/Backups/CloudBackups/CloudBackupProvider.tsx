import {
  useCallback,
  useEffect,
  useState,
  FunctionComponent,
  KeyboardEventHandler,
  ChangeEventHandler,
  MouseEventHandler,
} from 'react'
import {
  ButtonType,
  SettingName,
  CloudProvider,
  DropboxBackupFrequency,
  GoogleDriveBackupFrequency,
  OneDriveBackupFrequency,
} from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import Button from '@/Components/Button/Button'
import { openInNewTab } from '@/Utils'
import { Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { KeyboardKey } from '@standardnotes/ui-services'

type Props = {
  application: WebApplication
  providerName: CloudProvider
  isEntitledToCloudBackups: boolean
}

const CloudBackupProvider: FunctionComponent<Props> = ({ application, providerName, isEntitledToCloudBackups }) => {
  const [authBegan, setAuthBegan] = useState(false)
  const [successfullyInstalled, setSuccessfullyInstalled] = useState(false)
  const [backupFrequency, setBackupFrequency] = useState<string | undefined>(undefined)
  const [confirmation, setConfirmation] = useState('')

  const disable: MouseEventHandler = async (event) => {
    event.stopPropagation()

    try {
      const shouldDisable = await application.alertService.confirm(
        'Are you sure you want to disable this integration?',
        'Disable?',
        'Disable',
        ButtonType.Danger,
        'Cancel',
      )
      if (shouldDisable) {
        await application.settings.deleteSetting(backupFrequencySettingName)
        await application.settings.deleteSetting(backupTokenSettingName)

        setBackupFrequency(undefined)
      }
    } catch (error) {
      application.alertService.alert(error as string).catch(console.error)
    }
  }

  const installIntegration: MouseEventHandler = (event) => {
    if (!isEntitledToCloudBackups) {
      return
    }
    event.stopPropagation()

    const authUrl = application.getCloudProviderIntegrationUrl(providerName)
    openInNewTab(authUrl)
    setAuthBegan(true)
  }

  const performBackupNow = async () => {
    // A backup is performed anytime the setting is updated with the integration token, so just update it here
    try {
      await application.settings.updateSetting(backupFrequencySettingName, backupFrequency as string)
      void application.alertService.alert(
        'A backup has been triggered for this provider. Please allow a couple minutes for your backup to be processed.',
      )
    } catch (err) {
      application.alertService
        .alert('There was an error while trying to trigger a backup for this provider. Please try again.')
        .catch(console.error)
    }
  }

  const backupSettingsData = {
    [CloudProvider.Dropbox]: {
      backupTokenSettingName: SettingName.create(SettingName.NAMES.DropboxBackupToken).getValue(),
      backupFrequencySettingName: SettingName.create(SettingName.NAMES.DropboxBackupFrequency).getValue(),
      defaultBackupFrequency: DropboxBackupFrequency.Daily,
    },
    [CloudProvider.Google]: {
      backupTokenSettingName: SettingName.create(SettingName.NAMES.GoogleDriveBackupToken).getValue(),
      backupFrequencySettingName: SettingName.create(SettingName.NAMES.GoogleDriveBackupFrequency).getValue(),
      defaultBackupFrequency: GoogleDriveBackupFrequency.Daily,
    },
    [CloudProvider.OneDrive]: {
      backupTokenSettingName: SettingName.create(SettingName.NAMES.OneDriveBackupToken).getValue(),
      backupFrequencySettingName: SettingName.create(SettingName.NAMES.OneDriveBackupFrequency).getValue(),
      defaultBackupFrequency: OneDriveBackupFrequency.Daily,
    },
  }
  const { backupTokenSettingName, backupFrequencySettingName, defaultBackupFrequency } =
    backupSettingsData[providerName]

  const getCloudProviderIntegrationTokenFromUrl = (url: URL) => {
    const urlSearchParams = new URLSearchParams(url.search)
    let integrationTokenKeyInUrl = ''

    switch (providerName) {
      case CloudProvider.Dropbox:
        integrationTokenKeyInUrl = 'dbt'
        break
      case CloudProvider.Google:
        integrationTokenKeyInUrl = 'key'
        break
      case CloudProvider.OneDrive:
        integrationTokenKeyInUrl = 'key'
        break
      default:
        throw new Error('Invalid Cloud Provider name')
    }
    return urlSearchParams.get(integrationTokenKeyInUrl)
  }

  const handleKeyPress: KeyboardEventHandler = async (event) => {
    if (event.key === KeyboardKey.Enter) {
      try {
        const decryptedCode = atob(confirmation)
        const urlFromDecryptedCode = new URL(decryptedCode)
        const cloudProviderToken = getCloudProviderIntegrationTokenFromUrl(urlFromDecryptedCode)

        if (!cloudProviderToken) {
          throw new Error()
        }
        await application.settings.updateSetting(backupTokenSettingName, cloudProviderToken)
        await application.settings.updateSetting(backupFrequencySettingName, defaultBackupFrequency)

        setBackupFrequency(defaultBackupFrequency)

        setAuthBegan(false)
        setSuccessfullyInstalled(true)
        setConfirmation('')

        await application.alertService.alert(
          `${providerName} has been successfully installed. Your first backup has also been queued and should be reflected in your external cloud's folder within the next few minutes.`,
        )
      } catch (e) {
        await application.alertService.alert('Invalid code. Please try again.')
      }
    }
  }

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setConfirmation(event.target.value)
  }

  const getIntegrationStatus = useCallback(async () => {
    if (!application.getUser()) {
      return
    }
    const frequency = await application.settings.getSetting(backupFrequencySettingName)
    setBackupFrequency(frequency)
  }, [application, backupFrequencySettingName])

  useEffect(() => {
    getIntegrationStatus().catch(console.error)
  }, [getIntegrationStatus])

  const isExpanded = authBegan || successfullyInstalled
  const shouldShowEnableButton = !backupFrequency && !authBegan
  const additionalClass = isEntitledToCloudBackups ? '' : 'opacity-50 cursor-default pointer-events-none'

  return (
    <div
      className={`mr-1 ${isExpanded ? 'expanded' : ' '} ${
        shouldShowEnableButton || backupFrequency ? 'flex items-center justify-between' : ''
      }`}
    >
      <div>
        <Subtitle className={additionalClass}>{providerName}</Subtitle>

        {successfullyInstalled && <p>{providerName} has been successfully enabled.</p>}
      </div>
      {authBegan && (
        <div>
          <p className="sk-panel-row">
            Complete authentication from the newly opened window. Upon completion, a confirmation code will be
            displayed. Enter this code below:
          </p>
          <div className={'mt-1'}>
            <input
              className="sk-input sk-base center-text"
              placeholder="Enter confirmation code"
              value={confirmation}
              onKeyPress={handleKeyPress}
              onChange={handleChange}
            />
          </div>
        </div>
      )}
      {shouldShowEnableButton && (
        <div>
          <Button
            label="Enable"
            className={`min-w-40 px-1 text-xs ${additionalClass}`}
            onClick={installIntegration}
            disabled={!isEntitledToCloudBackups}
          />
        </div>
      )}

      {backupFrequency && (
        <div className={'flex flex-col items-end'}>
          <Button className={`mb-2 min-w-40 ${additionalClass}`} label="Perform Backup" onClick={performBackupNow} />
          <Button className="min-w-40" label="Disable" onClick={disable} />
        </div>
      )}
    </div>
  )
}

export default CloudBackupProvider
