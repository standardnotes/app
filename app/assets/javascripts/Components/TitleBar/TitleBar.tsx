import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const TitleBar: FunctionComponent<Props> = ({ children, className }) => (
  <div className={`sn-titlebar ${className ?? ''}`}>{children}</div>
)

export default TitleBar
