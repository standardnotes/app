import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const Title: FunctionComponent<Props> = ({ children, className }) => {
  return <div className={`font-bold ${className ?? ''}`}>{children}</div>
}

export default Title
