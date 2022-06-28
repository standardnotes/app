import { FunctionComponent } from 'react'

const PreferencesPane: FunctionComponent = ({ children }) => (
  <div className="text-foreground flex-grow flex flex-row overflow-y-auto min-h-0">
    <div className="flex-grow flex flex-col py-6 items-center">
      <div className="w-125 max-w-125 flex flex-col">
        {children != undefined && Array.isArray(children) ? children.filter((child) => child != undefined) : children}
      </div>
    </div>
    <div className="basis-[13.75rem] flex-shrink" />
  </div>
)

export default PreferencesPane
