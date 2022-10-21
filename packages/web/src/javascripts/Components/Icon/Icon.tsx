import { FunctionComponent } from 'react'
import { IconType } from '@standardnotes/snjs'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'

type Props = {
  type: IconType | string
  className?: string
  ariaLabel?: string
  size?: 'small' | 'medium' | 'normal' | 'large' | 'custom'
}

const ContainerDimensions = {
  small: 'w-3.5 h-3.5',
  medium: 'w-4 h-4',
  normal: 'w-5 h-5',
  large: 'w-6 h-6',
  custom: '',
}

const EmojiSize = {
  small: 'text-xs',
  medium: 'text-sm',
  normal: 'text-md',
  large: 'text-lg',
  custom: '',
}

const getIconComponent = (type: IconType | string) => {
  return IconNameToSvgMapping[type as keyof typeof IconNameToSvgMapping]
}

export const isIconEmoji = (type: IconType | string): boolean => {
  return getIconComponent(type) == undefined
}

const Icon: FunctionComponent<Props> = ({ type, className = '', ariaLabel, size = 'normal' }) => {
  const IconComponent = getIconComponent(type)
  if (!IconComponent) {
    return (
      <label className={`${EmojiSize[size]} ${ContainerDimensions[size]} fill-current text-center ${className}`}>
        {type}
      </label>
    )
  }

  return (
    <IconComponent
      className={`${ContainerDimensions[size]} fill-current ${className}`}
      role="img"
      {...(ariaLabel ? { 'aria-label': ariaLabel } : { 'aria-hidden': true })}
    />
  )
}

export default Icon
