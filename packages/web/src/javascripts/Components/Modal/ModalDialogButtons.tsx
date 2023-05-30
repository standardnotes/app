import { useAvailableSafeAreaPadding } from '@/Hooks/useSafeAreaPadding'
import { classNames } from '@standardnotes/utils'
import { FunctionComponent, ReactNode } from 'react'

type Props = {
  className?: string
  children?: ReactNode
}

const ModalDialogButtons: FunctionComponent<Props> = ({ children, className }) => {
  const { hasBottomInset } = useAvailableSafeAreaPadding()

  return (
    <div
      className={classNames(
        'flex items-center justify-end gap-3 border-t border-border px-4 py-4',
        hasBottomInset && 'pb-safe-bottom',
        className,
      )}
    >
      {children}
    </div>
  )
}

export default ModalDialogButtons
