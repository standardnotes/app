import { FileItem } from '@standardnotes/snjs'
import { MutableRefObject } from 'react'

export const createObjectURLWithRef = (
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
