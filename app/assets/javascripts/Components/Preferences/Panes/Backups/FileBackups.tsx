import { WebApplication } from '@/UIModels/Application'
import { observer } from 'mobx-react-lite'
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
  Text,
  Subtitle,
} from '@/Components/Preferences/PreferencesComponents'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { Button } from '@/Components/Button/Button'
import { FileBackupMetadataFile, isDesktopDevice } from '@standardnotes/snjs'
import { Switch } from '@/Components/Switch'
import { HorizontalSeparator } from '@/Components/Shared/HorizontalSeparator'
import { EncryptionStatusItem } from '../Security/Encryption'
import { Icon } from '@/Components/Icon'
import { StreamingFileApi } from '@standardnotes/filepicker'
import { FunctionComponent } from 'preact'

type Props = {
  application: WebApplication
}

export const FileBackups = observer(({ application }: Props) => {
  const [backupsEnabled, setBackupsEnabled] = useState(false)
  const [backupsLocation, setBackupsLocation] = useState('')
  const [backupsService, _] = useState(application.fileBackups)

  if (!isDesktopDevice(application.deviceInterface)) {
    return (
      <>
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>File Backups</Title>
            <Subtitle>
              Automatically save encrypted backups of files uploaded to any device to this computer. To use file
              backups, use the Standard Notes desktop application.
            </Subtitle>
          </PreferencesSegment>
        </PreferencesGroup>
      </>
    )
  }

  useEffect(() => {
    void backupsService.isFilesBackupsEnabled().then(setBackupsEnabled)
  }, [backupsService])

  useEffect(() => {
    if (backupsEnabled) {
      void backupsService.getFilesBackupsLocation().then(setBackupsLocation)
    }
  }, [backupsService, backupsEnabled])

  const changeBackupsLocation = useCallback(async () => {
    await backupsService.changeFilesBackupsLocation()

    setBackupsLocation(await backupsService.getFilesBackupsLocation())
  }, [backupsService])

  const openBackupsLocation = useCallback(async () => {
    await backupsService.openFilesBackupsLocation()
  }, [backupsService])

  const toggleBackups = useCallback(async () => {
    if (backupsEnabled) {
      await backupsService.disableFilesBackups()
    } else {
      await backupsService.enableFilesBackups()
    }

    setBackupsEnabled(await backupsService.isFilesBackupsEnabled())
  }, [backupsService, backupsEnabled])

  return (
    <>
      <PreferencesGroup>
        <PreferencesSegment>
          <Title>File Backups</Title>

          <div className="flex items-center justify-between">
            <div className="flex flex-col mr-10">
              <Subtitle>
                Automatically save encrypted backups of files uploaded on any device to this computer.
              </Subtitle>
            </div>
            <Switch onChange={toggleBackups} checked={backupsEnabled} />
          </div>

          {!backupsEnabled && (
            <>
              <HorizontalSeparator classes="mt-5 mb-4" />
              <Text>File backups are not enabled. Enable to choose where your files are backed up.</Text>
            </>
          )}
        </PreferencesSegment>

        {backupsEnabled && (
          <>
            <PreferencesSegment>
              <>
                <Text className="mb-3">
                  Files backups are enabled. When you upload a new file on any device and open this application, files
                  will be downloaded in encrypted form to:
                </Text>

                <EncryptionStatusItem
                  status={backupsLocation}
                  icon={[<Icon type="attachment-file" className="min-w-5 min-h-5" />]}
                  checkmark={false}
                />
                <div className="flex flex-row mt-5">
                  <Button
                    variant="normal"
                    label="Open Backups Location"
                    className={'mr-3 text-xs'}
                    onClick={openBackupsLocation}
                  />
                  <Button
                    variant="normal"
                    label="Change Backups Location"
                    className={'mr-3 text-xs'}
                    onClick={changeBackupsLocation}
                  />
                </div>
              </>
            </PreferencesSegment>

            <HorizontalSeparator classes="mt-5 mb-4" />

            <PreferencesSegment>
              <Text>
                To decrypt a backup file, drag and drop the file's respective <i>metadata.sn.json</i> file here.
              </Text>
              <BackupsDropZone application={application} />
            </PreferencesSegment>
          </>
        )}
      </PreferencesGroup>
    </>
  )
})

const isHandlingBackupDrag = (event: DragEvent, application: WebApplication) => {
  const items = event.dataTransfer?.items

  if (!items) {
    return false
  }

  return Array.from(items).every((item) => {
    const isFile = item.kind === 'file'
    const fileName = item.getAsFile()?.name || ''
    const isBackupMetadataFile = application.fileBackups?.isFileNameMetadataFile(fileName)
    return isFile && isBackupMetadataFile
  })
}

export const BackupsDropZone: FunctionComponent<Props> = ({ application }) => {
  const handleMetadataFileDrop = useCallback(
    async (metadata: FileBackupMetadataFile) => {
      const decryptedFile = await application.files.decryptBackupMetadataFile(metadata)

      if (!decryptedFile) {
        return
      }

      const fileSystem = new StreamingFileApi()
      await application.files.selectFileBackupAndSaveDecrypted(decryptedFile, fileSystem)
    },
    [application],
  )

  const handleDrag = useCallback(
    (event: DragEvent) => {
      if (isHandlingBackupDrag(event, application)) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [application],
  )

  const handleDragIn = useCallback(
    (event: DragEvent) => {
      if (!isHandlingBackupDrag(event, application)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
    },
    [application],
  )

  const handleDragOut = useCallback(
    (event: DragEvent) => {
      if (!isHandlingBackupDrag(event, application)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
    },
    [application],
  )

  const handleDrop = useCallback(
    async (event: DragEvent) => {
      if (!isHandlingBackupDrag(event, application)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const items = event.dataTransfer?.items

      if (!items || items.length === 0) {
        return
      }

      const item = items[0]
      const file = item.getAsFile()
      if (!file) {
        return
      }

      const text = await file.text()

      try {
        const metadata = JSON.parse(text) as FileBackupMetadataFile
        void handleMetadataFileDrop(metadata)
      } catch (error) {
        console.error(error)
      }

      event.dataTransfer.clearData()
    },
    [application, handleMetadataFileDrop],
  )

  useEffect(() => {
    window.addEventListener('dragenter', handleDragIn)
    window.addEventListener('dragleave', handleDragOut)
    window.addEventListener('dragover', handleDrag)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragIn)
      window.removeEventListener('dragleave', handleDragOut)
      window.removeEventListener('dragover', handleDrag)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleDragIn, handleDrop, handleDrag, handleDragOut])

  return null
}
