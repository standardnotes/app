import { mergeRefs } from '@/Hooks/mergeRefs'
import { Dialog, DialogOptions, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode, useCallback } from 'react'
import { useModalAnimation } from '../Modal/useModalAnimation'

type Props = {
  isOpen: boolean
  children: ReactNode
  animationVariant?: 'horizontal' | 'vertical'
  close: () => void
}

type DialogWithClose = HTMLDivElement & { close: () => void }

const ModalOverlay = forwardRef(
  (
    { isOpen, children, animationVariant, close, ...props }: Props & Partial<DialogOptions>,
    ref: ForwardedRef<HTMLDivElement>,
  ) => {
    const [isMounted, setElement] = useModalAnimation(isOpen, animationVariant)
    const dialog = useDialogStore({
      open: isMounted,
      setOpen: (open) => {
        if (!open) {
          close()
        }
      },
    })

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
        className="fixed left-0 top-0 z-modal h-full w-full"
        ref={mergeRefs([setElement, addCloseMethod, ref])}
        store={dialog}
        modal={false}
        portal={true}
        preventBodyScroll={true}
        {...props}
      >
        {children}
      </Dialog>
    )
  },
)

export default ModalOverlay
