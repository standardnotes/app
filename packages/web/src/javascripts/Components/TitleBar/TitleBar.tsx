import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const TitleBar: FunctionComponent<Props> = ({ children, className }) => (
  <div className={`w-full bg-default h-14 border-solid border-b border-border p-3 flex flex-row ${className ?? ''}`}>
    {children}
  </div>
)

export default TitleBar
