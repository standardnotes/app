import { FunctionComponent, ReactNode } from 'react'

type Props = {
  children: ReactNode
  classes?: string
}
const PreferencesSegment: FunctionComponent<Props> = ({ children, classes = '' }) => (
  <div className={`flex flex-col ${classes}`}>{children}</div>
)

export default PreferencesSegment
