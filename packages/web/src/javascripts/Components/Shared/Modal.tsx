import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isIOS } from '@/Utils'
import { AlertDialogContent, AlertDialogLabel } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useMemo } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
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

  const leftSlotAction = sortedActions.find((action) => action.mobileSlot === 'left')
  const rightSlotAction = sortedActions.find((action) => action.mobileSlot === 'right')
  const hasNonSlotActions = sortedActions.some((action) => !action.mobileSlot)
  const hasCancelAction = sortedActions.some((action) => action.type === 'cancel')
  const firstPrimaryActionIndex = sortedActions.findIndex((action) => action.type === 'primary')

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
              'flex flex-shrink-0 items-center justify-between rounded-t border-b border-solid border-border bg-default py-1.5 px-1 text-text md:px-4.5 md:py-3',
              isIOS() && 'pt-safe-top',
            )}
          >
            <div className="grid w-full grid-cols-[0.35fr_1fr_0.35fr] flex-row items-center justify-between gap-2 md:flex md:gap-0">
              {leftSlotAction ? (
                <MobileModalAction
                  type={leftSlotAction.type}
                  action={leftSlotAction.onClick}
                  disabled={leftSlotAction.disabled}
                >
                  {leftSlotAction.label}
                </MobileModalAction>
              ) : (
                <div className="md:hidden" />
              )}
              <div
                className={classNames(
                  'overflow-hidden text-ellipsis whitespace-nowrap text-center text-base font-semibold text-text md:flex-grow md:text-left md:text-lg',
                )}
              >
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
                >
                  {rightSlotAction.label}
                </MobileModalAction>
              ) : sortedActions.length === 0 || !hasCancelAction ? (
                <MobileModalAction children="Done" action={close} />
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
                  'items-center justify-start gap-3 border-t border-border py-2 px-2.5 md:px-4 md:py-4',
                  isIOS() && 'pb-safe-bottom',
                  hasNonSlotActions ? 'flex' : 'hidden md:flex',
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
