import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isIOS } from '@/Utils'
import { AlertDialogContent, AlertDialogLabel } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useMemo, useRef, useState } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import Popover from '../Popover/Popover'
import MobileModalAction from './MobileModalAction'
import ModalAndroidBackHandler from './ModalAndroidBackHandler'
import ModalDialogDescription from './ModalDialogDescription'

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
  className?: {
    content?: string
    description?: string
  }
  customHeader?: ReactNode
  customFooter?: ReactNode
  children: ReactNode
}

const Modal = ({ title, close, actions = [], className = {}, customHeader, customFooter, children }: Props) => {
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

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const rightSlotAction = sortedActions.find((action) => action.mobileSlot === 'right')
  const hasCancelAction = sortedActions.some((action) => action.type === 'cancel')
  const firstPrimaryActionIndex = sortedActions.findIndex((action) => action.type === 'primary')

  const nonPrimaryActions = sortedActions.filter((action) => action.type !== 'primary')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const advancedOptionRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <ModalAndroidBackHandler close={close} />
      <AlertDialogContent
        tabIndex={0}
        className={classNames(
          'm-0 flex h-full w-full flex-col border-solid border-border bg-default p-0 md:h-auto md:max-h-[85vh] md:w-160 md:rounded md:border md:shadow-main',
          className.content,
        )}
      >
        {customHeader ? (
          customHeader
        ) : (
          <AlertDialogLabel
            className={classNames(
              'flex flex-shrink-0 items-center justify-between rounded-t border-b border-solid border-border bg-default text-text md:px-4.5 md:py-3',
              isIOS() ? 'pt-safe-top' : 'py-1.5 px-2',
            )}
          >
            <div className="grid w-full grid-cols-[0.35fr_1fr_0.35fr] flex-row items-center justify-between gap-2 md:flex md:gap-0">
              {nonPrimaryActions.length > 1 ? (
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
                    anchorElement={advancedOptionRef.current}
                    disableMobileFullscreenTakeover={true}
                    togglePopover={() => setShowAdvanced((show) => !show)}
                    align="start"
                    portal={false}
                    className="w-1/2 !min-w-0 divide-y divide-border border border-border"
                  >
                    {nonPrimaryActions.map((action, index) => (
                      <button
                        className={classNames(
                          'p-2 text-base font-semibold hover:bg-contrast focus:bg-info-backdrop focus:shadow-none focus:outline-none',
                          action.type === 'destructive' && 'text-danger',
                        )}
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {action.label}
                      </button>
                    ))}
                  </Popover>
                </>
              ) : nonPrimaryActions.length === 1 ? (
                <MobileModalAction
                  type={nonPrimaryActions[0].type}
                  action={nonPrimaryActions[0].onClick}
                  disabled={nonPrimaryActions[0].disabled}
                  slot="left"
                >
                  {nonPrimaryActions[0].label}
                </MobileModalAction>
              ) : (
                <div className="md:hidden" />
              )}
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-base font-semibold text-text md:flex-grow md:text-left md:text-lg">
                {title}
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
              ) : sortedActions.length === 0 || !hasCancelAction ? (
                <MobileModalAction children="Done" action={close} slot="right" />
              ) : null}
            </div>
          </AlertDialogLabel>
        )}
        <ModalDialogDescription className={className.description}>{children}</ModalDialogDescription>
        {customFooter
          ? customFooter
          : sortedActions.length > 0 && (
              <div
                className={classNames(
                  'hidden items-center justify-start gap-3 border-t border-border py-2 px-2.5 md:flex md:px-4 md:py-4',
                  isIOS() && 'pb-safe-bottom',
                )}
              >
                {sortedActions.map((action, index) => (
                  <Button
                    primary={action.type === 'primary'}
                    colorStyle={action.type === 'destructive' ? 'danger' : undefined}
                    key={action.label.toString()}
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
      </AlertDialogContent>
    </>
  )
}

export default Modal
