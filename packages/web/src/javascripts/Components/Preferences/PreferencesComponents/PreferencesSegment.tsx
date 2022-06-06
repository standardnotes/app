import { FunctionComponent } from 'react'

type Props = {
  classes?: string
}
const PreferencesSegment: FunctionComponent<Props> = ({ children, classes = '' }) => (
  <div className={`flex flex-col ${classes}`}>{children}</div>
)

export default PreferencesSegment
