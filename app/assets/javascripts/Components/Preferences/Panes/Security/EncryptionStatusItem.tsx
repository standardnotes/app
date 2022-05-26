import { Icon } from '@/Components/Icon/Icon'
import { FunctionComponent, ReactNode } from 'react'

export const EncryptionStatusItem: FunctionComponent<{
  icon: ReactNode
  status: string
  checkmark?: boolean
}> = ({ icon, status, checkmark = true }) => (
  <div className="w-full rounded py-1.5 px-3 text-input my-1 min-h-8 flex flex-row items-center bg-contrast no-border focus-within:ring-info">
    {icon}
    <div className="min-w-3 min-h-1" />
    <div className="flex-grow color-text text-sm">{status}</div>
    <div className="min-w-3 min-h-1" />
    {checkmark && <Icon className="success min-w-4 min-h-4" type="check-bold" />}
  </div>
)
