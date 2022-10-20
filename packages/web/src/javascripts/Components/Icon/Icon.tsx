import { FunctionComponent, useMemo } from 'react'
import { IconType } from '@standardnotes/snjs'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'

type Props = {
  type: IconType | 'emoji'
  emoji?: string
  className?: string
  ariaLabel?: string
  size?: 'small' | 'medium' | 'normal' | 'custom'
}

const Icon: FunctionComponent<Props> = ({ type, emoji, className = '', ariaLabel, size = 'normal' }) => {
  const dimensions = useMemo(() => {
    switch (size) {
      case 'small':
        return 'w-3.5 h-3.5'
      case 'medium':
        return 'w-4 h-4'
      case 'custom':
        return ''
      default:
        return 'w-5 h-5'
    }
  }, [size])

  if (type === 'emoji') {
    return <label className={`${dimensions} fill-current ${className}`}>{emoji}</label>
  }

  const IconComponent = IconNameToSvgMapping[type as keyof typeof IconNameToSvgMapping]
  if (!IconComponent) {
    return null
  }

  return (
    <IconComponent
      className={`${dimensions} fill-current ${className}`}
      role="img"
      {...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    />
  )
}

export default Icon
