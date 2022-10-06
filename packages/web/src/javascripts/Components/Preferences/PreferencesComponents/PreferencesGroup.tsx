import { FunctionComponent, ReactNode } from 'react'

const PreferencesGroup: FunctionComponent<{
  children: ReactNode
}> = ({ children }) => (
  <div className="mb-3 flex max-w-full flex-col rounded border border-solid border-border bg-default p-6">
    {children}
  </div>
)

export default PreferencesGroup
