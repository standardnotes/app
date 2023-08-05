import { FunctionComponent } from 'react'

type Props = {
  classes?: string
}
const HorizontalSeparator: FunctionComponent<Props> = ({ classes = '' }) => {
  return <hr className={`min-h-[1px] w-full border-none bg-[--separator-color] ${classes}`} />
}

export default HorizontalSeparator
