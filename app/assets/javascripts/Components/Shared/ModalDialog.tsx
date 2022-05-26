import { FunctionComponent, useRef } from 'react'
import { AlertDialog } from '@reach/alert-dialog'

const ModalDialog: FunctionComponent = ({ children }) => {
  const ldRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog leastDestructiveRef={ldRef}>
      {/* sn-component is focusable by default, but doesn't stretch to child width
          resulting in a badly focused dialog. Utility classes are not available
          at the sn-component level, only below it. tabIndex -1 disables focus
          and enables it on the child component */}
      <div tabIndex={-1} className="sn-component">
        <div tabIndex={0} className="sk-panel w-160 bg-default rounded shadow-overlay focus:padded-ring-info">
          {children}
        </div>
      </div>
    </AlertDialog>
  )
}

export default ModalDialog
