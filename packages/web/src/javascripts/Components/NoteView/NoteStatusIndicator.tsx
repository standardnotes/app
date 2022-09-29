import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { useState } from 'react'
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
  const [shouldShowTooltip, setShouldShowTooltip] = useState(false)

  if (!status) {
    return null
  }

  return (
    <div className="relative">
      <button
        className={classNames(
          'peer flex h-5 w-5 items-center justify-center rounded-full',
          status.type === 'saving' && 'bg-contrast',
          status.type === 'saved' && 'bg-success text-success-contrast',
          status.type === 'error' && 'bg-danger text-danger-contrast',
          syncTakingTooLong && 'bg-warning text-warning-contrast',
        )}
        onClick={() => setShouldShowTooltip((show) => !show)}
        onBlur={() => setShouldShowTooltip(false)}
        aria-describedby={ElementIds.NoteStatusTooltip}
      >
        <Icon
          className={status.type === 'saving' ? 'animate-spin' : ''}
          type={status.type === 'saved' ? 'check' : status.type === 'error' ? 'warning' : 'sync'}
          size="small"
        />
        <span className="sr-only">Note sync status</span>
      </button>
      <div
        id={ElementIds.NoteStatusTooltip}
        className={classNames(
          shouldShowTooltip ? '' : 'hidden',
          'absolute top-full right-0 min-w-max translate-x-2 translate-y-1 select-none rounded border border-border bg-default py-1.5 px-3 text-left peer-hover:block peer-focus:block',
        )}
      >
        <div
          className={classNames(
            'text-sm font-bold',
            status.type === 'error' && 'text-danger',
            syncTakingTooLong && 'text-warning',
          )}
        >
          {status.message}
        </div>
        {status.desc && <div className="mt-0.5">{status.desc}</div>}
      </div>
    </div>
  )
}

export default NoteStatusIndicator
