import { FileItem } from '@standardnotes/snjs'
import { FunctionComponent, MutableRefObject, useEffect, useMemo, useRef } from 'react'
import ImagePreview from './ImagePreview'
import { PreviewableTextFileTypes } from './isFilePreviewable'
import TextPreview from './TextPreview'

type Props = {
  file: FileItem
  bytes: Uint8Array
}

const createObjectURLWithRef = (
  type: FileItem['mimeType'],
  bytes: Uint8Array,
  ref: MutableRefObject<string | undefined>,
) => {
  const objectURL = URL.createObjectURL(
    new Blob([bytes], {
      type,
    }),
  )

  ref.current = objectURL

  return objectURL
}

const PreviewComponent: FunctionComponent<Props> = ({ file, bytes }) => {
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

  if (file.mimeType.startsWith('image/')) {
    return <ImagePreview objectUrl={objectUrl} />
  }

  if (file.mimeType.startsWith('video/')) {
    return <video className="w-full h-full" src={objectUrl} controls autoPlay />
  }

  if (file.mimeType.startsWith('audio/')) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <audio src={objectUrl} controls />
      </div>
    )
  }

  if (PreviewableTextFileTypes.includes(file.mimeType)) {
    return <TextPreview bytes={bytes} />
  }

  return <object className="w-full h-full" data={objectUrl} />
}

export default PreviewComponent
