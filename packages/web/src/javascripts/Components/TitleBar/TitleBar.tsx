import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const TitleBar: FunctionComponent<Props> = ({ children, className }) => (
  <div
    className={`w-full bg-default h-14 border-solid border-b-1 border-border py-3 px-3 flex flex-row ${className ?? ''}`}
  >
    {children}
  </div>
)

export default TitleBar
