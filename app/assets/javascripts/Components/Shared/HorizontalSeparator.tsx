import { FunctionComponent } from 'react'

type Props = {
  classes?: string
}
const HorizontalSeparator: FunctionComponent<Props> = ({ classes = '' }) => {
  return <hr className={`h-1px w-full bg-border no-border ${classes}`} />
}

export default HorizontalSeparator
