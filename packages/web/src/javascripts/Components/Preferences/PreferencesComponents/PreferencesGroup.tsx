import { classNames } from '@standardnotes/utils'
import { FunctionComponent, ReactNode } from 'react'

const PreferencesGroup: FunctionComponent<{
  children: ReactNode
  id?: string
  className?: string
}> = ({ children, id, className }) => (
  <div
    id={id}
    className={classNames(
      'mb-3 flex max-w-full flex-col rounded border border-solid border-border bg-default p-6',
      className,
    )}
  >
    {children}
  </div>
)

export default PreferencesGroup
