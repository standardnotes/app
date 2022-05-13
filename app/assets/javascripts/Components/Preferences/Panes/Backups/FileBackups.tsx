import { WebApplication } from '@/UIModels/Application'
import { observer } from 'mobx-react-lite'
import {
  PreferencesGroup,
  PreferencesSegment,
  Title,
  Text,
  Subtitle,
} from '@/Components/Preferences/PreferencesComponents'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { Button } from '@/Components/Button/Button'
import { FileBackupMetadataFile, FileBackupsConstantsV1, FileContent, FileHandleRead } from '@standardnotes/snjs'
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
  const backupsService = useMemo(() => application.fileBackups, [application.fileBackups])

  if (!backupsService) {
    return (
      <>
        <PreferencesGroup>
          <PreferencesSegment>
            <Title>File Backups</Title>
            <Subtitle>Automatically save encrypted backups of files uploaded to any device to this computer.</Subtitle>
            <Text className="mt-3">To enable file backups, use the Standard Notes desktop application.</Text>
          </PreferencesSegment>
          <PreferencesSegment>
            <BackupsDropZone application={application} />
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
                  will be backed up in encrypted form to:
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
          </>
        )}

        <PreferencesSegment>
          <BackupsDropZone application={application} />
        </PreferencesSegment>
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
    const isBackupMetadataFile = application.files.isFileNameFileBackupMetadataFile(fileName)
    return isFile && isBackupMetadataFile
  })
}

export const BackupsDropZone: FunctionComponent<Props> = ({ application }) => {
  const [droppedFile, setDroppedFile] = useState<FileBackupMetadataFile | undefined>(undefined)
  const [decryptedFileContent, setDecryptedFileContent] = useState<FileContent | undefined>(undefined)
  const [binaryFile, setBinaryFile] = useState<FileHandleRead | undefined>(undefined)
  const [isSavingAsDecrypted, setIsSavingAsDecrypted] = useState(false)

  const fileSystem = useMemo(() => new StreamingFileApi(), [])

  useEffect(() => {
    if (droppedFile) {
      void application.files.decryptBackupMetadataFile(droppedFile).then(setDecryptedFileContent)
    } else {
      setDecryptedFileContent(undefined)
    }
  }, [droppedFile, application])

  const chooseRelatedBinaryFile = useCallback(async () => {
    const selection = await application.files.selectFile(fileSystem)

    if (selection === 'aborted' || selection === 'failed') {
      return
    }

    setBinaryFile(selection)
  }, [application, fileSystem])

  const downloadBinaryFileAsDecrypted = useCallback(async () => {
    if (!decryptedFileContent || !binaryFile) {
      return
    }

    setIsSavingAsDecrypted(true)

    const result = await application.files.readBackupFileAndSaveDecrypted(binaryFile, decryptedFileContent, fileSystem)

    if (result === 'success') {
      void application.alertService.alert(
        `<strong>${decryptedFileContent.name}</strong> has been successfully decrypted and saved to your chosen directory.`,
      )
      setBinaryFile(undefined)
      setDecryptedFileContent(undefined)
      setDroppedFile(undefined)
    } else if (result === 'failed') {
      void application.alertService.alert(
        'Unable to save file to local directory. This may be caused by failure to decrypt, or failure to save the file locally.',
      )
    }

    setIsSavingAsDecrypted(false)
  }, [decryptedFileContent, application, binaryFile, fileSystem])

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
        setDroppedFile(metadata)
      } catch (error) {
        console.error(error)
      }

      event.dataTransfer.clearData()
    },
    [application],
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

  if (!droppedFile) {
    return (
      <Text>
        To decrypt a backup file, drag and drop the file's respective <i>metadata.sn.json</i> file here.
      </Text>
    )
  }

  return (
    <>
      <PreferencesSegment>
        {!decryptedFileContent && <Text>Attempting to decrypt metadata file...</Text>}

        {decryptedFileContent && (
          <>
            <Title>Backup Decryption</Title>

            <EncryptionStatusItem
              status={decryptedFileContent.name}
              icon={[<Icon type="attachment-file" className="min-w-5 min-h-5" />]}
              checkmark={true}
            />

            <HorizontalSeparator classes={'mt-3 mb-3'} />

            <div className="flex justify-between items-center">
              <div>
                <Subtitle>1. Choose related data file</Subtitle>
                <Text className={`text-xs mr-3 em ${binaryFile ? 'font-bold success' : ''}`}>
                  {droppedFile.file.uuid}/{FileBackupsConstantsV1.BinaryFileName}
                </Text>
              </div>
              <div>
                <Button
                  variant="normal"
                  label="Choose"
                  className={'px-1 text-xs min-w-40'}
                  onClick={chooseRelatedBinaryFile}
                  disabled={!!binaryFile}
                />
              </div>
            </div>

            <HorizontalSeparator classes={'mt-3 mb-3'} />

            <div className="flex justify-between items-center">
              <Subtitle>2. Decrypt and save file to your computer</Subtitle>

              <div>
                <Button
                  variant="normal"
                  label={isSavingAsDecrypted ? undefined : 'Save'}
                  className={'px-1 text-xs min-w-40'}
                  onClick={downloadBinaryFileAsDecrypted}
                  disabled={isSavingAsDecrypted || !binaryFile}
                >
                  {isSavingAsDecrypted && (
                    <div className="flex justify-center w-full">
                      <div className="sk-spinner w-5 h-5 spinner-info"></div>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </PreferencesSegment>
    </>
  )
}
