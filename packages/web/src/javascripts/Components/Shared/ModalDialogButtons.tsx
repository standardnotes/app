import { isIOS } from '@/Utils'
import { classNames } from '@standardnotes/utils'
import { FunctionComponent, ReactNode } from 'react'

type Props = {
  className?: string
  children?: ReactNode
}

const ModalDialogButtons: FunctionComponent<Props> = ({ children, className }) => (
  <>
    <hr className="m-0 h-[1px] border-none bg-border" />
    <div
      className={classNames('flex items-center justify-end gap-3 px-4 py-4', isIOS() && 'pb-safe-bottom', className)}
    >
      {children}
    </div>
  </>
)

export default ModalDialogButtons
