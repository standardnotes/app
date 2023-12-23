import Icon from '@/Components/Icon/Icon'
import { FunctionComponent, ReactNode } from 'react'

type Props = {
  icon: ReactNode
  status: string
  checkmark?: boolean
}

const EncryptionStatusItem: FunctionComponent<Props> = ({ icon, status, checkmark = true }) => (
  <div className="text-input no-border my-1 flex min-h-8 w-full flex-row items-center rounded bg-contrast px-3 py-1.5 focus-within:ring-info">
    {icon}
    <div className="min-h-1 min-w-3" />
    <div className="flex-grow text-sm text-text">{status}</div>
    <div className="min-h-1 min-w-3" />
    {checkmark && <Icon className="min-h-4 min-w-4 text-success" type="check-bold" />}
  </div>
)

export default EncryptionStatusItem
