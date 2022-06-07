import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const ModalDialogButtons: FunctionComponent<Props> = ({ children, className }) => (
  <>
    <hr className="h-1px bg-border no-border m-0" />
    <div className={`px-4 py-4 flex flex-row items-center ${className}`}>
      {children != undefined && Array.isArray(children)
        ? children.map((child, idx, arr) => (
            <>
              {child}
              {idx < arr.length - 1 ? <div className="min-w-3" /> : undefined}
            </>
          ))
        : children}
    </div>
  </>
)

export default ModalDialogButtons
