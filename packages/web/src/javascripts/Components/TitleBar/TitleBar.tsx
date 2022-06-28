import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const TitleBar: FunctionComponent<Props> = ({ children, className }) => (
  <div className={`flex h-14 w-full flex-row border-b border-solid border-border bg-default p-3 ${className ?? ''}`}>
    {children}
  </div>
)

export default TitleBar
