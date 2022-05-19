import { FunctionComponent } from 'preact'

export const TitleBar: FunctionComponent<{ className?: string }> = ({ children, className }) => (
  <div className={`sn-titlebar ${className ?? ''}`}>{children}</div>
)
