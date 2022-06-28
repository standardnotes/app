import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const ModalDialogButtons: FunctionComponent<Props> = ({ children, className }) => (
  <>
    <hr className="m-0 h-[1px] border-none bg-border" />
    <div className={`flex flex-row items-center px-4 py-4 ${className}`}>
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
