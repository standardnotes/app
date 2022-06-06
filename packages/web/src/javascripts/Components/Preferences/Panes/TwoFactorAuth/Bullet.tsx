import { FunctionComponent } from 'react'

type Props = {
  className?: string
}

const Bullet: FunctionComponent<Props> = ({ className = '' }) => (
  <div className={`min-w-1 min-h-1 rounded-full bg-inverted-default ${className} mr-2`} />
)

export default Bullet
