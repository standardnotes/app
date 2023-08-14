import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import MobileModalAction from './MobileModalAction'
import MobileModalHeader from './MobileModalHeader'
import ModalAndroidBackHandler from './ModalAndroidBackHandler'

export type ModalAction = {
  label: NonNullable<ReactNode>
  type: 'primary' | 'secondary' | 'destructive' | 'cancel'
  onClick: () => void
  mobileSlot?: 'left' | 'right'
  hidden?: boolean
  disabled?: boolean
}

type Props = {
  title: string
  close: () => void
  actions?: ModalAction[]
  className?: string
  customHeader?: ReactNode
  disableCustomHeader?: boolean
  customFooter?: ReactNode
  children: ReactNode
}

const Modal = ({
  title,
  close,
  actions = [],
  className,
  customHeader,
  disableCustomHeader = false,
  customFooter,
  children,
}: Props) => {
  const sortedActions = useMemo(
    () =>
      actions
        .sort((a, b) => {
          if (a.type === 'cancel') {
            return -1
          }
          if (b.type === 'cancel') {
            return 1
          }
          if (a.type === 'destructive') {
            return -1
          }
          if (b.type === 'destructive') {
            return 1
          }
          if (a.type === 'secondary') {
            return -1
          }
          if (b.type === 'secondary') {
            return 1
          }
          return 0
        })
        .filter((action) => !action.hidden),
    [actions],
  )

  const primaryActions = sortedActions.filter((action) => action.type === 'primary')
  if (primaryActions.length > 1) {
    throw new Error('Modal can only have 1 primary action')
  }

  const cancelActions = sortedActions.filter((action) => action.type === 'cancel')
  if (cancelActions.length > 1) {
    throw new Error('Modal can only have 1 cancel action')
  }

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const leftSlotAction = sortedActions.find((action) => action.mobileSlot === 'left')
  const rightSlotAction = sortedActions.find((action) => action.mobileSlot === 'right')
  const firstPrimaryActionIndex = sortedActions.findIndex((action) => action.type === 'primary')

  const extraActions = sortedActions.filter((action) => action.type !== 'primary' && action.type !== 'cancel')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const advancedOptionRef = useRef<HTMLButtonElement>(null)

  const { hasTopInset, hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <>
      <ModalAndroidBackHandler close={close} />
      {customHeader && !disableCustomHeader ? (
        customHeader
      ) : (
        <div
          className={classNames(
            'flex w-full flex-shrink-0 select-none items-center justify-between rounded-t border-b border-solid border-border bg-default px-2 text-text md:px-4.5 md:py-3 md:translucent-ui:bg-transparent',
            hasTopInset ? 'pb-1.5 pt-safe-top' : 'py-1.5',
          )}
        >
          <MobileModalHeader className="flex-row items-center justify-between md:flex md:gap-0">
            {leftSlotAction ? (
              <MobileModalAction
                type={leftSlotAction.type}
                action={leftSlotAction.onClick}
                disabled={leftSlotAction.disabled}
                slot="left"
              >
                {leftSlotAction.label}
              </MobileModalAction>
            ) : (
              <div className="md:hidden" />
            )}
            <div className="flex items-center justify-center gap-2 overflow-hidden text-center font-semibold text-text md:flex-grow md:text-left md:text-lg">
              {extraActions.length > 0 && (
                <>
                  <MobileModalAction
                    type="secondary"
                    action={() => setShowAdvanced((show) => !show)}
                    slot="left"
                    ref={advancedOptionRef}
                  >
                    <div className="rounded-full border border-border p-0.5">
                      <Icon type="more" />
                    </div>
                  </MobileModalAction>
                  <Popover
                    title="Advanced"
                    open={showAdvanced}
                    anchorElement={advancedOptionRef}
                    disableMobileFullscreenTakeover={true}
                    togglePopover={() => setShowAdvanced((show) => !show)}
                    align="start"
                    portal={false}
                    className="!fixed divide-y divide-border border border-border"
                  >
                    {extraActions
                      .filter((action) => action.type !== 'cancel')
                      .map((action, index) => (
                        <button
                          className={classNames(
                            'p-2 text-base font-semibold hover:bg-contrast focus:bg-info-backdrop focus:shadow-none focus:outline-none',
                            action.type === 'destructive' && 'text-danger',
                          )}
                          key={index}
                          onClick={() => {
                            action.onClick()
                            setShowAdvanced(false)
                          }}
                          disabled={action.disabled}
                        >
                          {action.label}
                        </button>
                      ))}
                  </Popover>
                </>
              )}
              <span className="overflow-hidden text-ellipsis whitespace-nowrap ">{title}</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <button tabIndex={0} className="ml-2 rounded p-1 font-bold hover:bg-contrast" onClick={close}>
                <Icon type="close" />
              </button>
            </div>
            {rightSlotAction ? (
              <MobileModalAction
                type={rightSlotAction.type}
                action={rightSlotAction.onClick}
                disabled={rightSlotAction.disabled}
                slot="right"
              >
                {rightSlotAction.label}
              </MobileModalAction>
            ) : null}
          </MobileModalHeader>
        </div>
      )}
      <div className={classNames('flex-grow overflow-y-auto', className)}>{children}</div>
      {customFooter
        ? customFooter
        : sortedActions.length > 0 && (
            <div
              className={classNames(
                'hidden items-center justify-start gap-3 border-t border-border px-2.5 py-2 md:flex md:px-4 md:py-4',
                hasBottomInset && 'pb-safe-bottom',
              )}
            >
              {sortedActions.map((action, index) => (
                <Button
                  primary={action.type === 'primary'}
                  colorStyle={action.type === 'destructive' ? 'danger' : undefined}
                  key={index}
                  onClick={action.onClick}
                  className={classNames(
                    action.mobileSlot ? 'hidden md:block' : '',
                    index === firstPrimaryActionIndex && 'ml-auto',
                  )}
                  data-type={action.type}
                  disabled={action.disabled}
                  small={isMobileScreen}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
    </>
  )
}

export default Modal
