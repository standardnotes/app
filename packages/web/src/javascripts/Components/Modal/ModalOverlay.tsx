import { mergeRefs } from '@/Hooks/mergeRefs'
import { Dialog, useDialogStore } from '@ariakit/react'
import { ForwardedRef, forwardRef, ReactNode } from 'react'
import { useModalAnimation } from '../Modal/useModalAnimation'

type Props = {
  isOpen: boolean
  children: ReactNode
  animationVariant?: 'horizontal' | 'vertical'
  close: () => void
}

const ModalOverlay = forwardRef(
  ({ isOpen, children, animationVariant, close, ...props }: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const [isMounted, setElement] = useModalAnimation(isOpen, animationVariant)
    const dialog = useDialogStore({
      open: isMounted,
      setOpen: (open) => {
        if (!open) {
          close()
        }
      },
    })

    if (!isMounted) {
      return null
    }

    return (
      <Dialog
        tabIndex={0}
        className="fixed top-0 left-0 z-modal h-full w-full"
        ref={mergeRefs([setElement, ref])}
        store={dialog}
        getPersistentElements={() =>
          Array.from(document.querySelectorAll('[role="dialog"], [role="alertdialog"]')).map((el) => {
            return el.parentElement ? el.parentElement : el
          })
        }
        {...props}
      >
        {children}
      </Dialog>
    )
  },
)

export default ModalOverlay
