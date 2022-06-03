import { FileItem } from '@standardnotes/snjs'
import { FunctionComponent, useEffect, useState } from 'react'
import ImagePreview from './ImagePreview'
import { PreviewableTextFileTypes } from './isFilePreviewable'
import TextPreview from './TextPreview'

type Props = {
  file: FileItem
  bytes: Uint8Array
}

const PreviewComponent: FunctionComponent<Props> = ({ file, bytes }) => {
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    if (!objectUrl) {
      setObjectUrl(
        URL.createObjectURL(
          new Blob([bytes], {
            type: file.mimeType,
          }),
        ),
      )
    }

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [bytes, file.mimeType, objectUrl])

  if (file.mimeType.startsWith('image/')) {
    return <ImagePreview objectUrl={objectUrl} />
  }

  if (file.mimeType.startsWith('video/')) {
    return <video className="w-full h-full" src={objectUrl} controls autoPlay />
  }

  if (file.mimeType.startsWith('audio/')) {
    return <audio src={objectUrl} controls />
  }

  if (PreviewableTextFileTypes.includes(file.mimeType)) {
    return <TextPreview bytes={bytes} />
  }

  return <object className="w-full h-full" data={objectUrl} />
}

export default PreviewComponent
