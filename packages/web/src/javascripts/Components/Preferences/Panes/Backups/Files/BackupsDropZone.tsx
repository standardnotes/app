import { Title, Text, Subtitle } from '@/Components/Preferences/PreferencesComponents/Content'
import { useCallback, useEffect, useMemo, useState, FunctionComponent } from 'react'
import Button from '@/Components/Button/Button'
import { FileBackupMetadataFile, FileBackupsConstantsV1, FileItem, FileHandleRead } from '@standardnotes/snjs'
import HorizontalSeparator from '@/Components/Shared/HorizontalSeparator'
import Icon from '@/Components/Icon/Icon'
import { ClassicFileReader, StreamingFileApi } from '@standardnotes/filepicker'
import { WebApplication } from '@/Application/WebApplication'
import EncryptionStatusItem from '../../Security/EncryptionStatusItem'
import PreferencesSegment from '@/Components/Preferences/PreferencesComponents/PreferencesSegment'
import Spinner from '@/Components/Spinner/Spinner'

type Props = {
  application: WebApplication
}

const BackupsDropZone: FunctionComponent<Props> = ({ application }) => {
  const [droppedFile, setDroppedFile] = useState<FileBackupMetadataFile | undefined>(undefined)
  const [decryptedFileItem, setDecryptedFileItem] = useState<FileItem | undefined>(undefined)
  const [binaryFile, setBinaryFile] = useState<FileHandleRead | undefined>(undefined)
  const [isSavingAsDecrypted, setIsSavingAsDecrypted] = useState(false)

  const fileSystem = useMemo(() => new StreamingFileApi(), [])

  useEffect(() => {
    if (droppedFile) {
      void application.files.decryptBackupMetadataFile(droppedFile).then(setDecryptedFileItem)
    } else {
      setDecryptedFileItem(undefined)
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
    if (!decryptedFileItem || !binaryFile) {
      return
    }

    setIsSavingAsDecrypted(true)

    const result = await application.files.readBackupFileAndSaveDecrypted(binaryFile, decryptedFileItem, fileSystem)

    if (result === 'success') {
      void application.alerts.alert(
        `<strong>${decryptedFileItem.name}</strong> has been successfully decrypted and saved to your chosen directory.`,
      )
      setBinaryFile(undefined)
      setDecryptedFileItem(undefined)
      setDroppedFile(undefined)
    } else if (result === 'failed') {
      void application.alerts.alert(
        'Unable to save file to local directory. This may be caused by failure to decrypt, or failure to save the file locally.',
      )
    }

    setIsSavingAsDecrypted(false)
  }, [decryptedFileItem, application, binaryFile, fileSystem])

  const handleFileSelection = useCallback(
    async (file: File) => {
      const text = await file.text()
      const type = application.files.isFileNameFileBackupRelated(file.name)
      if (type === false) {
        return
      }

      if (type === 'binary') {
        void application.alerts.alert('Please drag the metadata file instead of the encrypted data file.')
        return
      }

      try {
        const metadata = JSON.parse(text) as FileBackupMetadataFile
        setDroppedFile(metadata)
      } catch (error) {
        console.error(error)
      }
    },
    [application.alerts, application.files],
  )

  const handleDragOver = useCallback((event: DragEvent) => {
    event.stopPropagation()
  }, [])

  const handleDragIn = useCallback((event: DragEvent) => {
    event.stopPropagation()
  }, [])

  const handleDragOut = useCallback((event: DragEvent) => {
    event.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    async (event: DragEvent) => {
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

      await handleFileSelection(file).catch(console.error)

      event.dataTransfer.clearData()
    },
    [handleFileSelection],
  )

  useEffect(() => {
    window.addEventListener('dragenter', handleDragIn)
    window.addEventListener('dragleave', handleDragOut)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragIn)
      window.removeEventListener('dragleave', handleDragOut)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleDragIn, handleDrop, handleDragOver, handleDragOut])

  if (!droppedFile) {
    return (
      <>
        <Text className="mb-2">
          To decrypt a backup file, drag and drop the file's respective <i>metadata.sn.json</i> file here or select it
          below.
        </Text>
        <Button
          onClick={() => {
            ClassicFileReader.selectFiles()
              .then(async (files) => {
                if (files.length === 0) {
                  return
                }
                const file = files[0]
                handleFileSelection(file).catch(console.error)
              })
              .catch(console.error)
          }}
        >
          Select file
        </Button>
      </>
    )
  }

  return (
    <>
      <PreferencesSegment>
        {!decryptedFileItem && <Text>Attempting to decrypt metadata file...</Text>}

        {decryptedFileItem && (
          <>
            <Title>Backup Decryption</Title>

            <EncryptionStatusItem
              status={decryptedFileItem.name}
              icon={<Icon type="attachment-file" className="min-h-5 min-w-5" />}
              checkmark={true}
            />

            <HorizontalSeparator classes={'mt-3 mb-3'} />

            <div className="flex items-center justify-between">
              <div>
                <Subtitle>1. Choose related data file</Subtitle>
                <Text className={`em mr-3 text-xs ${binaryFile ? 'success font-bold' : ''}`}>
                  {droppedFile.file.uuid}/{FileBackupsConstantsV1.BinaryFileName}
                </Text>
              </div>
              <div>
                <Button
                  label="Choose"
                  className={'min-w-40 px-1 text-xs'}
                  onClick={chooseRelatedBinaryFile}
                  disabled={!!binaryFile}
                />
              </div>
            </div>

            <HorizontalSeparator classes={'mt-3 mb-3'} />

            <div className="flex items-center justify-between">
              <Subtitle>2. Decrypt and save file to your computer</Subtitle>

              <div>
                <Button
                  label={isSavingAsDecrypted ? undefined : 'Save'}
                  className={'min-w-40 px-1 text-xs'}
                  onClick={downloadBinaryFileAsDecrypted}
                  disabled={isSavingAsDecrypted || !binaryFile}
                >
                  {isSavingAsDecrypted && (
                    <div className="flex w-full justify-center">
                      <Spinner className="h-5 w-5" />
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

export default BackupsDropZone
