import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

export const TitleBar: FunctionComponent<Props> = ({ children, className }) => (
  <div className={`sn-titlebar ${className ?? ''}`}>{children}</div>
)
