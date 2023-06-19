import { classNames } from '@standardnotes/utils'

import Icon from '@/Components/Icon/Icon'
import { Status } from './Status'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  status: Status | undefined
  className?: string
}

const StatusIndicator = ({ status, className }: Props) => {
  let statusClassName: string
  let icon: string
  switch (status?.state) {
    case 'online':
      statusClassName = 'bg-success text-success-contrast'
      icon = 'check'
      break
    case 'error':
      statusClassName = 'bg-danger text-danger-contrast'
      icon = 'warning'
      break
    default:
      statusClassName = 'bg-contrast'
      icon = 'sync'
      break
  }

  return (
    <div className="note-status-tooltip-container relative">
      <div
        className={classNames('peer flex h-5 w-5 items-center justify-center rounded-full', statusClassName, className)}
        aria-describedby={ElementIds.NoteStatusTooltip}
      >
        <Icon className={status?.state === 'restarting' ? 'animate-spin' : ''} type={icon} size="small" />
      </div>
    </div>
  )
}

export default StatusIndicator
