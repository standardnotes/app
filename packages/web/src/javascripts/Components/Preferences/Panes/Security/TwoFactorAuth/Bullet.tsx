import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const Bullet: FunctionComponent<Props> = ({ className = '' }) => (
  <div className={`min-h-1 min-w-1 rounded-full bg-text ${className} mr-2`} />
)

export default Bullet
