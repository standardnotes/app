import { FunctionComponent } from 'react'

const PreferencesGroup: FunctionComponent = ({ children }) => (
  <div className="bg-default border border-solid rounded border-border p-6 flex flex-col mb-3">{children}</div>
)

export default PreferencesGroup
