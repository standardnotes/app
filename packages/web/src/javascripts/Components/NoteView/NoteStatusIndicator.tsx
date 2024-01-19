import { classNames } from '@standardnotes/utils'
import { ReactNode, useCallback, useRef, useState } from 'react'
import { IconType, PrefKey, PrefDefaults, SNNote } from '@standardnotes/snjs'
import Icon from '../Icon/Icon'
import { useApplication } from '../ApplicationProvider'
import { observer } from 'mobx-react-lite'
import { VisuallyHidden } from '@ariakit/react'
import Button from '../Button/Button'
import Popover from '../Popover/Popover'
import { getRelativeTimeString } from '@/Utils/GetRelativeTimeString'

export type NoteStatus = {
  type: 'saving' | 'saved' | 'error' | 'waiting'
  message: string
  description?: ReactNode
}

const IndicatorWithTooltip = ({
  className,
  onClick,
  icon,
  isTooltipVisible,
  setIsTooltipVisible,
  children,
  animateIcon = false,
}: {
  className: string
  onClick: () => void
  icon: IconType
  isTooltipVisible: boolean
  setIsTooltipVisible: React.Dispatch<React.SetStateAction<boolean>>
  children: ReactNode
  animateIcon?: boolean
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="note-status-tooltip-container">
      <button
        className={classNames('peer flex h-5 w-5 cursor-pointer items-center justify-center rounded-full', className)}
        onClick={onClick}
        ref={buttonRef}
      >
        <Icon className={animateIcon ? 'animate-spin' : ''} type={icon} size="small" />
        <VisuallyHidden>Note sync status</VisuallyHidden>
      </button>
      <Popover
        title="Note sync status"
        open={isTooltipVisible}
        togglePopover={() => setIsTooltipVisible((visible) => !visible)}
        className="px-3 py-2"
        containerClassName="!min-w-0 !w-auto max-w-[90vw]"
        anchorElement={buttonRef}
        side="bottom"
        align="center"
        offset={6}
        disableMobileFullscreenTakeover
        disableApplyingMobileWidth
      >
        {children}
      </Popover>
    </div>
  )
}

type Props = {
  note: SNNote
  status: NoteStatus | undefined
  syncTakingTooLong: boolean
  updateSavingIndicator?: boolean
}

const NoteStatusIndicator = ({
  note,
  status,
  syncTakingTooLong,
  updateSavingIndicator = PrefDefaults[PrefKey.UpdateSavingStatusIndicator],
}: Props) => {
  const application = useApplication()
  const [isTooltipVisible, setIsTooltipVisible] = useState(false)

  const toggleTooltip = useCallback(() => {
    setIsTooltipVisible((visible) => !visible)
  }, [])

  const toggleShowPreference = useCallback(() => {
    void application.setPreference(PrefKey.UpdateSavingStatusIndicator, !updateSavingIndicator)
  }, [application, updateSavingIndicator])

  if (updateSavingIndicator && !status) {
    return null
  }

  if (status && status.type === 'error') {
    return (
      <IndicatorWithTooltip
        className="bg-danger text-danger-contrast"
        onClick={toggleTooltip}
        icon="warning"
        isTooltipVisible={isTooltipVisible}
        setIsTooltipVisible={setIsTooltipVisible}
      >
        <div className="text-sm font-bold text-danger">{status.message}</div>
        {status.description && <div className="mt-0.5">{status.description}</div>}
      </IndicatorWithTooltip>
    )
  }

  if (syncTakingTooLong) {
    return (
      <IndicatorWithTooltip
        className="bg-warning text-warning-contrast"
        onClick={toggleTooltip}
        icon={status && status.type === 'saving' ? 'sync' : 'warning'}
        isTooltipVisible={isTooltipVisible}
        setIsTooltipVisible={setIsTooltipVisible}
      >
        {status ? (
          <>
            <div className="text-sm font-bold text-warning">{status.message}</div>
            {status.description && <div className="mt-0.5">{status.description}</div>}
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
          status.type === 'waiting' && 'bg-warning text-warning-contrast',
        )}
        onClick={toggleTooltip}
        icon={status.type === 'saving' ? 'sync' : status.type === 'waiting' ? 'clock' : 'check'}
        animateIcon={status.type === 'saving'}
        isTooltipVisible={isTooltipVisible}
        setIsTooltipVisible={setIsTooltipVisible}
      >
        <div className="text-sm font-bold">{status.message}</div>
        {status.description && <div className="mt-0.5">{status.description}</div>}
        {status.type === 'waiting' && note.lastSyncEnd && (
          <div className="mt-0.5">Last synced {getRelativeTimeString(note.lastSyncEnd)}</div>
        )}
        {status.type === 'waiting' ? (
          <Button
            small
            className="mt-1"
            onClick={() => {
              application.sync.sync().catch(console.error)
              toggleTooltip()
            }}
          >
            Sync now
          </Button>
        ) : (
          <Button small className="mt-1" onClick={toggleShowPreference}>
            Disable status updates
          </Button>
        )}
      </IndicatorWithTooltip>
    )
  }

  return (
    <IndicatorWithTooltip
      className="bg-contrast text-passive-1"
      onClick={toggleTooltip}
      icon="info"
      isTooltipVisible={isTooltipVisible}
      setIsTooltipVisible={setIsTooltipVisible}
    >
      <div className="text-sm font-bold">Note status updates are disabled</div>
      <Button small className="mt-1" onClick={toggleShowPreference}>
        Enable status updates
      </Button>
    </IndicatorWithTooltip>
  )
}

export default observer(NoteStatusIndicator)
