import { ElementIds } from '@/Constants/ElementIDs'
import { PrefDefaults } from '@/Constants/PrefDefaults'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { ReactNode, useState } from 'react'
import { IconType, PrefKey } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'

export type NoteStatus = {
  type: 'saving' | 'saved' | 'error'
  message: string
  desc?: string
}

const IndicatorWithTooltip = ({
  className,
  onClick,
  onBlur,
  icon,
  isTooltipVisible,
  children,
}: {
  className: string
  onClick: () => void
  onBlur: () => void
  icon: IconType
  isTooltipVisible: boolean
  children: ReactNode
}) => (
  <div className="relative">
    <button
      className={classNames('peer flex h-5 w-5 items-center justify-center rounded-full', className)}
      onClick={onClick}
      onBlur={onBlur}
      aria-describedby={ElementIds.NoteStatusTooltip}
    >
      <Icon className={icon === 'sync' ? 'animate-spin' : ''} type={icon} size="small" />
      <span className="sr-only">Note sync status</span>
    </button>
    <div
      id={ElementIds.NoteStatusTooltip}
      className={classNames(
        isTooltipVisible ? '' : 'hidden',
        'absolute top-full right-0 min-w-max translate-x-2 translate-y-1 select-none rounded border border-border bg-default py-1.5 px-3 text-left peer-hover:block peer-focus:block',
      )}
    >
      {children}
    </div>
  </div>
)

type Props = {
  status: NoteStatus | undefined
  syncTakingTooLong: boolean
  updateSavingIndicator?: boolean
}

const NoteStatusIndicator = ({
  status,
  syncTakingTooLong,
  updateSavingIndicator = PrefDefaults[PrefKey.UpdateSavingStatusIndicator],
}: Props) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const onClick = () => setIsTooltipVisible((show) => !show)
  const onBlur = () => setIsTooltipVisible(false)

  if (updateSavingIndicator && !status) {
    return null
  }

  if (status && status.type === 'error') {
    return (
      <IndicatorWithTooltip
        className="bg-danger text-danger-contrast"
        onClick={onClick}
        onBlur={onBlur}
        icon="warning"
        isTooltipVisible={isTooltipVisible}
      >
        <div className="text-sm font-bold text-danger">{status.message}</div>
        {status.desc && <div className="mt-0.5">{status.desc}</div>}
      </IndicatorWithTooltip>
    )
  }

  if (syncTakingTooLong) {
    return (
      <IndicatorWithTooltip
        className="bg-warning text-warning-contrast"
        onClick={onClick}
        onBlur={onBlur}
        icon={status && status.type === 'saving' ? 'sync' : 'warning'}
        isTooltipVisible={isTooltipVisible}
      >
        {status ? (
          <>
            <div className="text-sm font-bold text-warning">{status.message}</div>
            {status.desc && <div className="mt-0.5">{status.desc}</div>}
          </>
        ) : (
          <div className="text-sm font-bold text-warning">Sync taking too long</div>
        )}
      </IndicatorWithTooltip>
    )
  }

  if (updateSavingIndicator && status) {
    return (
      <IndicatorWithTooltip
        className={classNames(
          status.type === 'saving' && 'bg-contrast',
          status.type === 'saved' && 'bg-success text-success-contrast',
        )}
        onClick={onClick}
        onBlur={onBlur}
        icon={status.type === 'saving' ? 'sync' : 'check'}
        isTooltipVisible={isTooltipVisible}
      >
        <div className="text-sm font-bold">{status.message}</div>
        {status.desc && <div className="mt-0.5">{status.desc}</div>}
      </IndicatorWithTooltip>
    )
  }

  return (
    <IndicatorWithTooltip
      className="bg-contrast"
      onClick={onClick}
      onBlur={onBlur}
      icon="eye-off"
      isTooltipVisible={isTooltipVisible}
    >
      <div className="text-sm font-bold">Note status updates are disabled</div>
      <div className="mt-0.5">They can be turned in the Preferences under General &gt; Tools</div>
    </IndicatorWithTooltip>
  )
}

export default NoteStatusIndicator
