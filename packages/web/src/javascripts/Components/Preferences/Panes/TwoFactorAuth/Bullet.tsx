import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const Bullet: FunctionComponent<Props> = ({ className = '' }) => (
  <div className={`min-h-1 bg-inverted-default min-w-1 rounded-full ${className} mr-2`} />
)

export default Bullet
