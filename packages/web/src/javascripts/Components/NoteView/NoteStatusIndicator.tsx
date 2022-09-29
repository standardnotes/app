import { classNames } from '@/Utils/ConcatenateClassNames'
import Icon from '../Icon/Icon'

export type NoteStatus = {
  type: 'saving' | 'saved' | 'error'
  message: string
  desc?: string
}

type Props = {
  status: NoteStatus | undefined
  syncTakingTooLong: boolean
}

const NoteStatusIndicator = ({ status, syncTakingTooLong }: Props) => {
  if (!status) {
    return null
  }

  return (
    <div
      className={classNames(
        'flex h-5 w-5 items-center justify-center rounded-full',
        status.type === 'saving'
          ? syncTakingTooLong
            ? 'bg-warning text-warning-contrast'
            : 'bg-info text-info-contrast'
          : '',
        status.type === 'saved' && 'bg-success text-success-contrast',
        status.type === 'error' && 'bg-danger text-danger-contrast',
      )}
    >
      <Icon
        className={status.type === 'saving' ? 'animate-spin' : ''}
        type={status.type === 'saved' ? 'check' : status.type === 'error' ? 'warning' : 'sync'}
        size="small"
      />
    </div>
  )
}

export default NoteStatusIndicator
