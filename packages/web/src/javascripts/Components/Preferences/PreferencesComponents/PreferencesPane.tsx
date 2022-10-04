import { FunctionComponent, ReactNode } from 'react'

const PreferencesPane: FunctionComponent<{ children?: ReactNode }> = ({ children }) => (
  <div className="flex min-h-0 flex-grow flex-col overflow-y-auto text-foreground md:flex-row">
    <div className="flex flex-grow flex-col items-center px-3 py-6 md:px-0">
      <div className="flex max-w-full flex-col md:w-125 md:max-w-125">
        {children != undefined && Array.isArray(children) ? children.filter((child) => child != undefined) : children}
      </div>
    </div>
    <div className="hidden flex-shrink basis-[13.75rem] md:block" />
  </div>
)

export default PreferencesPane
