import { WebApplication } from '@/Application/Application'
import { concatenateUint8Arrays } from '@/Utils'
import { FileItem } from '@standardnotes/snjs'
import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/Components/Spinner/Spinner'
import FilePreviewError from './FilePreviewError'
import { isFileTypePreviewable } from './isFilePreviewable'
import PreviewComponent from './PreviewComponent'

type Props = {
  application: WebApplication
  file: FileItem
}

const FilePreview = ({ file, application }: Props) => {
  const isFilePreviewable = useMemo(() => {
    return isFileTypePreviewable(file.mimeType)
  }, [file.mimeType])

  const [isDownloading, setIsDownloading] = useState(true)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadedBytes, setDownloadedBytes] = useState<Uint8Array>()

  useEffect(() => {
    if (!isFilePreviewable) {
      setIsDownloading(false)
      setDownloadProgress(0)
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
        setDownloadProgress(0)
        await application.files.downloadFile(file, async (decryptedChunk, progress) => {
          chunks.push(decryptedChunk)
          if (progress) {
            setDownloadProgress(Math.round(progress.percentComplete))
          }
        })
        const finalDecryptedBytes = concatenateUint8Arrays(chunks)
        setDownloadedBytes(finalDecryptedBytes)
      } catch (error) {
        console.error(error)
      } finally {
        setIsDownloading(false)
      }
    }

    void downloadFileForPreview()
  }, [application.files, downloadedBytes, file, isFilePreviewable])

  return isDownloading ? (
    <div className="flex flex-col justify-center items-center flex-grow">
      <div className="flex items-center">
        <Spinner className="w-5 h-5 mr-3" />
        <div className="text-base font-semibold">{downloadProgress}%</div>
      </div>
      <span className="mt-3">Loading file...</span>
    </div>
  ) : downloadedBytes ? (
    <PreviewComponent file={file} bytes={downloadedBytes} />
  ) : (
    <FilePreviewError
      file={file}
      filesController={application.getViewControllerManager().filesController}
      tryAgainCallback={() => {
        setDownloadedBytes(undefined)
      }}
      isFilePreviewable={isFilePreviewable}
    />
  )
}

export default FilePreview
