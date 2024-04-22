import { WebApplication } from '@/Application/WebApplication'
import { concatenateUint8Arrays } from '@/Utils'
import {
  ApplicationEvent,
  FileDownloadProgress,
  FileItem,
  LocalPrefKey,
  fileProgressToHumanReadableString,
} from '@standardnotes/snjs'
import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/Components/Spinner/Spinner'
import FilePreviewError from './FilePreviewError'
import { isFileTypePreviewable } from './isFilePreviewable'
import PreviewComponent from './PreviewComponent'
import Button from '../Button/Button'
import { ProtectedIllustration } from '@standardnotes/icons'
import { ImageZoomLevelProps } from './ImageZoomLevelProps'
import { useLocalPreference } from '../../Hooks/usePreference'
import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  application: WebApplication
  file: FileItem
  isEmbeddedInSuper?: boolean
} & ImageZoomLevelProps

const FilePreview = ({ file, application, isEmbeddedInSuper = false, imageZoomLevel, setImageZoomLevel }: Props) => {
  const [alwaysAutoDownload] = useLocalPreference(LocalPrefKey.AlwaysAutoDownloadSuperEmbeds)
  const [autoDownloadLimit] = useLocalPreference(LocalPrefKey.SuperEmbedAutoDownloadLimit)
  const isOverLimit = file.decryptedSize > autoDownloadLimit

  const [shouldDownload, setShouldDownload] = useState(isEmbeddedInSuper ? alwaysAutoDownload || !isOverLimit : true)
  useEffect(() => {
    if (!isEmbeddedInSuper) {
      return
    }
    setShouldDownload(alwaysAutoDownload || !isOverLimit)
  }, [alwaysAutoDownload, isEmbeddedInSuper, isOverLimit])

  const [isAuthorized, setIsAuthorized] = useState(application.isAuthorizedToRenderItem(file))

  const isFilePreviewable = useMemo(() => {
    return isFileTypePreviewable(file.mimeType)
  }, [file.mimeType])

  const [isDownloading, setIsDownloading] = useState(shouldDownload)
  const [downloadProgress, setDownloadProgress] = useState<FileDownloadProgress | undefined>()
  const [downloadedBytes, setDownloadedBytes] = useState<Uint8Array>()

  useEffect(() => {
    setIsAuthorized(application.isAuthorizedToRenderItem(file))
  }, [file.protected, application, file])

  useEffect(() => {
    const disposer = application.addEventObserver(async (event) => {
      if (event === ApplicationEvent.UnprotectedSessionBegan) {
        setIsAuthorized(true)
      } else if (event === ApplicationEvent.UnprotectedSessionExpired) {
        setIsAuthorized(application.isAuthorizedToRenderItem(file))
      }
    })

    return disposer
  }, [application, file])

  useEffect(() => {
    if (!shouldDownload) {
      return
    }

    if (!isFilePreviewable || !isAuthorized) {
      setIsDownloading(false)
      setDownloadProgress(undefined)
      setDownloadedBytes(undefined)
      return
    }

    const downloadFileForPreview = async () => {
      if (downloadedBytes) {
        return
      }

      setIsDownloading(true)

      try {
        const chunks: Uint8Array[] = []
        setDownloadProgress(undefined)
        const error = await application.files.downloadFile(file, async (decryptedChunk, progress) => {
          chunks.push(decryptedChunk)
          if (progress) {
            setDownloadProgress(progress)
          }
        })

        if (!error) {
          const finalDecryptedBytes = concatenateUint8Arrays(chunks)
          setDownloadedBytes(finalDecryptedBytes)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setIsDownloading(false)
      }
    }

    void downloadFileForPreview()
  }, [application.files, downloadedBytes, file, isFilePreviewable, isAuthorized, shouldDownload])

  if (!isAuthorized) {
    const hasProtectionSources = application.hasProtectionSources()

    return (
      <div className="flex flex-grow flex-col items-center justify-center">
        <ProtectedIllustration className="mb-4 h-30 w-30" />
        <div className="mb-2 text-base font-bold">This file is protected.</div>
        <p className="max-w-[35ch] text-center text-sm text-passive-0">
          {hasProtectionSources
            ? 'Authenticate to view this file.'
            : 'Add a passcode or create an account to require authentication to view this file.'}
        </p>
        <div className="mt-3 flex gap-3">
          {!hasProtectionSources && (
            <Button primary small onClick={() => application.showAccountMenu()}>
              Open account menu
            </Button>
          )}
          <Button primary onClick={() => application.protections.authorizeItemAccess(file)}>
            {hasProtectionSources ? 'Authenticate' : 'View file'}
          </Button>
        </div>
      </div>
    )
  }

  if (!shouldDownload && !isDownloading && !downloadedBytes) {
    return (
      <div className="flex flex-grow flex-col items-center justify-center p-1.5">
        <div className="mb-2 text-center text-base font-bold">{file.name}</div>
        <p className="mb-2 text-center text-sm text-passive-0">
          This file was not automatically downloaded because it was larger (
          {formatSizeToReadableString(file.decryptedSize)}) than the set limit for auto-downloading embedded files (
          {formatSizeToReadableString(autoDownloadLimit)})
        </p>
        <div className="mb-2 flex flex-wrap gap-3">
          <Button primary onClick={() => setShouldDownload(true)}>
            Download
          </Button>
          <Button
            onClick={() => {
              const preferences = application.preferencesController
              preferences.openPreferences('general')
              setTimeout(() => {
                const prefElement = document.getElementById(ElementIds.AutoDownloadLimitPreference)
                if (prefElement) {
                  prefElement.scrollIntoView({
                    block: 'center',
                  })
                  prefElement.querySelector('button')?.focus()
                  setTimeout(() => {
                    prefElement.animate(
                      [
                        {
                          transform: 'scale(1)',
                        },
                        {
                          transform: 'scale(1.05)',
                        },
                        {
                          transform: 'scale(1)',
                        },
                      ],
                      {
                        duration: 350,
                      },
                    )
                  }, 100)
                }
              }, 50)
            }}
          >
            Change limit
          </Button>
        </div>
      </div>
    )
  }

  return isDownloading ? (
    <div className="flex flex-grow flex-col items-center justify-center">
      <div className="flex items-center">
        <Spinner className="mr-3 h-5 w-5" />
        {downloadProgress && (
          <div className="text-base font-semibold">{Math.floor(downloadProgress.percentComplete)}%</div>
        )}
      </div>
      {downloadProgress ? (
        <span className="mt-3">
          {fileProgressToHumanReadableString(downloadProgress, file.name, { showPercent: false })}
        </span>
      ) : (
        <span className="mt-3">Loading...</span>
      )}
    </div>
  ) : downloadedBytes ? (
    <PreviewComponent
      application={application}
      file={file}
      bytes={downloadedBytes}
      isEmbeddedInSuper={isEmbeddedInSuper}
      imageZoomLevel={imageZoomLevel}
      setImageZoomLevel={setImageZoomLevel}
    />
  ) : (
    <FilePreviewError
      file={file}
      filesController={application.filesController}
      tryAgainCallback={() => {
        setDownloadedBytes(undefined)
      }}
      isFilePreviewable={isFilePreviewable}
    />
  )
}

export default FilePreview
