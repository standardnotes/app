import { FunctionComponent, useState } from 'react'
import IconButton from '@/Components/Button/IconButton'

type Props = {
  copyValue: string
}

const CopyButton: FunctionComponent<Props> = ({ copyValue: secretKey }) => {
  const [isCopied, setCopied] = useState(false)
  return (
    <IconButton
      focusable={false}
      title="Copy to clipboard"
      icon={isCopied ? 'check' : 'copy'}
      className={`${isCopied ? 'success' : undefined} p-0`}
      onClick={() => {
        navigator?.clipboard?.writeText(secretKey).catch(console.error)
        setCopied(() => true)
      }}
    />
  )
}

export default CopyButton
