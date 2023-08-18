import { mergeRefs } from '@/Hooks/mergeRefs'
import { Dialog, DialogOptions, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode, useCallback, useId } from 'react'
import { useModalAnimation } from '../Modal/useModalAnimation'
import { DialogWithClose } from '@/Utils/CloseOpenModalsAndPopovers'
import { useMediaQuery, MutuallyExclusiveMediaQueryBreakpoints } from '@/Hooks/useMediaQuery'
import { classNames } from '@standardnotes/snjs'

type Props = {
  isOpen: boolean
  children: ReactNode
  animate?: 'mobile' | 'desktop' | 'both'
  animationVariant?: 'horizontal' | 'vertical'
  close: () => void
  className?: string
  backdropClassName?: string
}

const ModalOverlay = forwardRef(
  (
    {
      isOpen,
      children,
      animationVariant,
      close,
      className,
      backdropClassName,
      animate,
      ...props
    }: Props & Partial<DialogOptions>,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
    const [isMounted, setElement] = useModalAnimation(
      isOpen,
      isMobileScreen,
      animationVariant,
      (animate === 'mobile' && !isMobileScreen) || (animate === 'desktop' && isMobileScreen),
    )
    const dialog = useDialogStore({
      open: isMounted,
      setOpen: (open) => {
        if (!open) {
          close()
        }
      },
      animated: !isMobileScreen,
    })

    const portalId = useId()
    const getPortalElement = useCallback(() => {
      const id = 'portal/' + portalId
      const existing = document.getElementById(id)
      if (existing) {
        return existing
      }
      const div = document.createElement('div')
      div.id = id
      div.className = 'fixed flex items-center justify-center left-0 top-0 z-modal h-full w-full pointer-events-none'
      document.body.appendChild(div)
      return div
    }, [portalId])

    const addCloseMethod = useCallback(
      (element: HTMLDivElement | null) => {
        if (element) {
          ;(element as DialogWithClose).close = close
        }
      },
      [close],
    )

    if (!isMounted) {
      return null
    }

    return (
      <Dialog
        tabIndex={0}
        className={classNames(
          'z-[1] pointer-events-auto m-0 flex h-full w-full flex-col border-[--popover-border-color] bg-default md:bg-[--popover-background-color] md:[backdrop-filter:var(--popover-backdrop-filter)] p-0 md:h-auto md:max-h-[85vh] md:w-160 md:rounded md:border md:shadow-main',
          'focus-visible:shadow-none focus-visible:outline-none',
          className,
        )}
        backdrop={
          <div
            className={classNames(
              'absolute z-0 h-full w-full bg-passive-5 opacity-0 pointer-events-auto',
              'md:transition-opacity md:duration-75 md:opacity-50 [&[data-enter]]:md:opacity-75',
              backdropClassName,
            )}
            onClick={close}
          />
        }
        ref={mergeRefs([setElement, addCloseMethod, ref])}
        store={dialog}
        modal={false}
        portal={true}
        portalElement={getPortalElement}
        preventBodyScroll={true}
        hideOnInteractOutside={false}
        {...props}
      >
        {children}
      </Dialog>
    )
  },
)

export default ModalOverlay
