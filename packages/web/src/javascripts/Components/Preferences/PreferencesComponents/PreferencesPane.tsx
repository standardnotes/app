import { FunctionComponent } from 'react'

const PreferencesPane: FunctionComponent = ({ children }) => (
  <div className="flex min-h-0 flex-grow flex-row overflow-y-auto text-foreground">
    <div className="flex flex-grow flex-col items-center py-6">
      <div className="flex w-125 max-w-125 flex-col">
        {children != undefined && Array.isArray(children) ? children.filter((child) => child != undefined) : children}
      </div>
    </div>
    <div className="flex-shrink basis-[13.75rem]" />
  </div>
)

export default PreferencesPane
