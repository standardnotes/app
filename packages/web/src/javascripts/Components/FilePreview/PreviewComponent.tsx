import { WebApplication } from '@/Application/Application'
import { getBase64FromBlob } from '@/Utils'
import { FileItem } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react'
import Button from '../Button/Button'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'
import { createObjectURLWithRef } from './CreateObjectURLWithRef'
import ImagePreview from './ImagePreview'
import { PreviewableTextFileTypes, RequiresNativeFilePreview } from './isFilePreviewable'
import TextPreview from './TextPreview'

type Props = {
  application: WebApplication
  file: FileItem
  bytes: Uint8Array
}

const PreviewComponent: FunctionComponent<Props> = ({ application, file, bytes }) => {
  const { selectedPane } = useResponsiveAppPane()

  const objectUrlRef = useRef<string>()

  const objectUrl = useMemo(() => {
    return createObjectURLWithRef(file.mimeType, bytes, objectUrlRef)
  }, [bytes, file.mimeType])

  useEffect(() => {
    const objectUrl = objectUrlRef.current

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
        objectUrlRef.current = ''
      }
    }
  }, [])

  const isNativeMobileWeb = application.isNativeMobileWeb()
  const requiresNativePreview = RequiresNativeFilePreview.includes(file.mimeType)

  const openNativeFilePreview = useCallback(async () => {
    if (!isNativeMobileWeb) {
      throw new Error('Native file preview cannot be used on non-native platform')
    }

    const fileBase64 = await getBase64FromBlob(
      new Blob([bytes], {
        type: file.mimeType,
      }),
    )

    void application.mobileDevice().previewFile(fileBase64, file.name)
  }, [application, bytes, file.mimeType, file.name, isNativeMobileWeb])

  useEffect(() => {
    const shouldOpenNativePreviewOnLoad =
      isNativeMobileWeb && selectedPane === AppPaneId.Editor && requiresNativePreview
    if (shouldOpenNativePreviewOnLoad) {
      void openNativeFilePreview()
    }
  }, [isNativeMobileWeb, openNativeFilePreview, requiresNativePreview, selectedPane])

  if (isNativeMobileWeb && requiresNativePreview) {
    return (
      <div className="flex flex-grow flex-col items-center justify-center">
        <div className="text-base font-bold">Previewing file...</div>
        <Button className="mt-3" primary onClick={openNativeFilePreview}>
          Re-open file preview
        </Button>
      </div>
    )
  }

  if (file.mimeType.startsWith('image/')) {
    return <ImagePreview objectUrl={objectUrl} />
  }

  if (file.mimeType.startsWith('video/')) {
    return <video className="h-full w-full" src={objectUrl} controls autoPlay />
  }

  if (file.mimeType.startsWith('audio/')) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <audio src={objectUrl} controls />
      </div>
    )
  }

  if (PreviewableTextFileTypes.includes(file.mimeType)) {
    return <TextPreview bytes={bytes} />
  }

  return <object className="h-full w-full" data={objectUrl} />
}

export default PreviewComponent
