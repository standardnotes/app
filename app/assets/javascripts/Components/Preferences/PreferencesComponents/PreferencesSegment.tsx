import { FunctionComponent } from 'react'

type Props = {
  classes?: string
}
export const PreferencesSegment: FunctionComponent<Props> = ({ children, classes = '' }) => (
  <div className={`flex flex-col ${classes}`}>{children}</div>
)
