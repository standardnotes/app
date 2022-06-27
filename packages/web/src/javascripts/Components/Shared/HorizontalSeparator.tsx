import { FunctionComponent } from 'react'

type Props = {
  classes?: string
}
const HorizontalSeparator: FunctionComponent<Props> = ({ classes = '' }) => {
  return <hr className={`min-h-[1px] w-full bg-border border-none ${classes}`} />
}

export default HorizontalSeparator
