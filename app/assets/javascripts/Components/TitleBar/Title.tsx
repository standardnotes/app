import { FunctionComponent } from 'preact'

export const Title: FunctionComponent<{ className?: string }> = ({ children, className }) => {
  return <div className={`sn-title ${className ?? ''}`}>{children}</div>
}
