import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

export const Title: FunctionComponent<Props> = ({ children, className }) => {
  return <div className={`sn-title ${className ?? ''}`}>{children}</div>
}
