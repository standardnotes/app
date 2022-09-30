import { isDesktopApplication } from '@/Utils'
import { alertDialog, sanitizeFileName } from '@standardnotes/ui-services'
import {
  STRING_IMPORT_SUCCESS,
  STRING_INVALID_IMPORT_FILE,
  STRING_IMPORTING_ZIP_FILE,
  STRING_UNSUPPORTED_BACKUP_FILE_VERSION,
  StringImportError,
  STRING_E2E_ENABLED,
  STRING_LOCAL_ENC_ENABLED,
  STRING_ENC_NOT_ENABLED,
} from '@/Constants/Strings'
import { BackupFile } from '@standardnotes/snjs'
import { ChangeEventHandler, MouseEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import Button from '@/Components/Button/Button'
import PreferencesGroup from '../../PreferencesComponents/PreferencesGroup'
import PreferencesSegment from '../../PreferencesComponents/PreferencesSegment'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Spinner from '@/Components/Spinner/Spinner'
import { downloadOrShareBlobBasedOnPlatform } from '@/Utils/DownloadOrShareBasedOnPlatform'

type Props = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
}

const DataBackups = ({ application, viewControllerManager }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImportDataLoading, setIsImportDataLoading] = useState(false)
  const {
    isBackupEncrypted,
    isEncryptionEnabled,
    setIsBackupEncrypted,
    setIsEncryptionEnabled,
    setEncryptionStatusString,
  } = viewControllerManager.accountMenuController

  const refreshEncryptionStatus = useCallback(() => {
    const hasUser = application.hasAccount()
    const hasPasscode = application.hasPasscode()

    const encryptionEnabled = hasUser || hasPasscode

    const encryptionStatusString = hasUser
      ? STRING_E2E_ENABLED
      : hasPasscode
      ? STRING_LOCAL_ENC_ENABLED
      : STRING_ENC_NOT_ENABLED

    setEncryptionStatusString(encryptionStatusString)
    setIsEncryptionEnabled(encryptionEnabled)
    setIsBackupEncrypted(encryptionEnabled)
  }, [application, setEncryptionStatusString, setIsBackupEncrypted, setIsEncryptionEnabled])

  useEffect(() => {
    refreshEncryptionStatus()
  }, [refreshEncryptionStatus])

  const downloadDataArchive = async () => {
    const data = isBackupEncrypted
      ? await application.createEncryptedBackupFile()
      : await application.createDecryptedBackupFile()

    if (!data) {
      return
    }

    const blobData = new Blob([JSON.stringify(data, null, 2)], {
      type: 'text/json',
    })

    if (isBackupEncrypted) {
      const filename = `Standard Notes Encrypted Backup and Import File - ${application
        .getArchiveService()
        .formattedDateForExports()}.txt`
      const sanitizedFilename = sanitizeFileName(filename)
      downloadOrShareBlobBasedOnPlatform(application, blobData, sanitizedFilename)
    } else {
      // downloadZippedDecryptedItems(data).catch(console.error)
    }
  }

  const readFile = async (file: File): Promise<any> => {
    if (file.type === 'application/zip') {
      application.alertService.alert(STRING_IMPORTING_ZIP_FILE).catch(console.error)
      return
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          resolve(data)
        } catch (e) {
          application.alertService.alert(STRING_INVALID_IMPORT_FILE).catch(console.error)
        }
      }
      reader.readAsText(file)
    })
  }

  const performImport = async (data: BackupFile) => {
    setIsImportDataLoading(true)

    const result = await application.mutator.importData(data)

    setIsImportDataLoading(false)

    if (!result) {
      return
    }

    let statusText = STRING_IMPORT_SUCCESS
    if ('error' in result) {
      statusText = result.error.text
    } else if (result.errorCount) {
      statusText = StringImportError(result.errorCount)
    }
    void alertDialog({
      text: statusText,
    })
  }

  const importFileSelected: ChangeEventHandler<HTMLInputElement> = async (event) => {
    const { files } = event.target

    if (!files) {
      return
    }
    const file = files[0]
    const data = await readFile(file)
    if (!data) {
      return
    }

    const version = data.version || data.keyParams?.version || data.auth_params?.version
    if (!version) {
      await performImport(data)
      return
    }

    if (application.protocolService.supportedVersions().includes(version)) {
      await performImport(data)
    } else {
      setIsImportDataLoading(false)
      void alertDialog({ text: STRING_UNSUPPORTED_BACKUP_FILE_VERSION })
    }
  }

  // Whenever "Import Backup" is either clicked or key-pressed, proceed the import
  const handleImportFile: MouseEventHandler = (event) => {
    if (event instanceof KeyboardEvent) {
      const { code } = event

      // Process only when "Enter" or "Space" keys are pressed
      if (code !== 'Enter' && code !== 'Space') {
        return
      }
      // Don't proceed the event's default action
      // (like scrolling in case the "space" key is pressed)
      event.preventDefault()
    }

    ;(fileInputRef.current as HTMLInputElement).click()
  }

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>Data Backups</Title>

          {isDesktopApplication() && (
            <Text className="mb-3">
              Backups are automatically created on desktop and can be managed via the "Backups" top-level menu.
            </Text>
          )}

          <Subtitle>Download a backup of all your data</Subtitle>

          {isEncryptionEnabled && (
            <form className="sk-panel-form sk-panel-row">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input type="radio" onChange={() => setIsBackupEncrypted(true)} checked={isBackupEncrypted} />
                  <span className="text-sm font-medium">Encrypted</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" onChange={() => setIsBackupEncrypted(false)} checked={!isBackupEncrypted} />
                  <span className="text-sm font-medium">Decrypted</span>
                </label>
              </div>
            </form>
          )}

          <Button onClick={downloadDataArchive} label="Download backup" className="mt-2" />
        </PreferencesSegment>
        <HorizontalSeparator classes="my-4" />
        <PreferencesSegment>
          <Subtitle>Import a previously saved backup file</Subtitle>

          <div className="mt-3 flex flex-row items-center">
            <Button label="Import backup" onClick={handleImportFile} />
            <input type="file" ref={fileInputRef} onChange={importFileSelected} className="hidden" />
            {isImportDataLoading && <Spinner className="ml-4" />}
          </div>
        </PreferencesSegment>
      </PreferencesGroup>
    </>
  )
}

export default observer(DataBackups)
