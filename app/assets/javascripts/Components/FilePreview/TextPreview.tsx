import { ElementIds } from '@/Constants/ElementIDs'
import { useMemo } from 'react'

type Props = {
  bytes: Uint8Array
}

const TextPreview = ({ bytes }: Props) => {
  const text = useMemo(() => {
    const textDecoder = new TextDecoder()
    return textDecoder.decode(bytes)
  }, [bytes])

  return (
    <textarea
      autoComplete="off"
      className="w-full h-full flex-grow font-editor focus:shadow-none focus:outline-none"
      dir="auto"
      id={ElementIds.FileTextPreview}
      defaultValue={text}
      readOnly={true}
    ></textarea>
  )
}

export default TextPreview
