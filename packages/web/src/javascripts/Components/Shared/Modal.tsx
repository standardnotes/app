import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { isIOS } from '@/Utils'
import { AlertDialogOverlay, AlertDialogContent, AlertDialogLabel } from '@reach/alert-dialog'
import { classNames } from '@standardnotes/snjs'
import { ReactNode, useRef } from 'react'
import Button from '../Button/Button'
import Icon from '../Icon/Icon'
import MobileModalAction from './MobileModalAction'
import ModalDialogDescription from './ModalDialogDescription'
import { ModalState } from './ModalState'

type Props = {
  state: ModalState
  children: ReactNode
}

const Modal = ({ state, children }: Props) => {
  const { title, actions, isOpen, dismissOnOverlayClick, close } = state

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const [isMounted, setElement] = useLifecycleAnimation(
    {
      open: isOpen,
      enter: {
        keyframes: [
          {
            opacity: 0.25,
            transform: 'translateY(1rem)',
          },
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 150,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: 'bottom',
        },
      },
      enterCallback: (element) => {
        element.scrollTop = 0
      },
      exit: {
        keyframes: [
          {
            opacity: 1,
            transform: 'translateY(0)',
          },
          {
            opacity: 0,
            transform: 'translateY(1rem)',
          },
        ],
        options: {
          easing: 'cubic-bezier(.36,.66,.04,1)',
          duration: 150,
          fill: 'forwards',
        },
        initialStyle: {
          transformOrigin: 'bottom',
        },
      },
    },
    !isMobileScreen,
  )

  const ldRef = useRef<HTMLButtonElement>(null)

  if (!isMounted) {
    return null
  }

  const leftSlotAction = actions.find((action) => action.mobileSlot === 'left')
  const rightSlotAction = actions.find((action) => action.mobileSlot === 'right')
  const hasNonSlotActions = actions.some((action) => !action.mobileSlot)
  const hasCancelAction = actions.some((action) => action.type === 'cancel')

  return (
    <AlertDialogOverlay
      className="p-0 opacity-0 md:px-0 md:opacity-100"
      leastDestructiveRef={ldRef}
      onDismiss={dismissOnOverlayClick ? close : undefined}
      ref={setElement}
    >
      <AlertDialogContent
        tabIndex={0}
        className={classNames(
          'm-0 flex h-full w-full flex-col border-solid border-border bg-default p-0 md:h-auto md:max-h-[85vh] md:w-160 md:rounded md:border md:shadow-main',
        )}
      >
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
              {/* {headerButtons} */}
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
            ) : actions.length === 0 || !hasCancelAction ? (
              <MobileModalAction children="Done" action={close} />
            ) : null}
          </div>
          <hr className="h-1px no-border m-0 bg-border" />
        </AlertDialogLabel>
        <ModalDialogDescription>{children}</ModalDialogDescription>
        <div
          className={classNames(
            'items-center justify-end gap-3 border-t border-border px-4 py-4',
            isIOS() && 'pb-safe-bottom',
            hasNonSlotActions ? 'flex' : 'hidden md:flex',
          )}
        >
          {actions.map((action) => (
            <Button
              primary={action.type === 'primary'}
              key={action.label}
              onClick={action.onClick}
              className={classNames(
                action.type === 'cancel' ? 'mr-auto' : '',
                action.mobileSlot ? 'hidden md:block' : '',
              )}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialogOverlay>
  )
}

export default Modal
