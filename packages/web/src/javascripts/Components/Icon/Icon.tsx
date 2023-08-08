import { FunctionComponent } from 'react'
import { VectorIconNameOrEmoji } from '@standardnotes/snjs'
import { IconNameToSvgMapping } from './IconNameToSvgMapping'
import { classNames } from '@standardnotes/utils'
import { LexicalIconName, LexicalIconNameToSvgMapping } from './LexicalIcons'

type Size = 'small' | 'medium' | 'normal' | 'large' | 'custom'

type Props = {
  type: VectorIconNameOrEmoji | LexicalIconName
  className?: string
  ariaLabel?: string
  size?: Size
  emojiSize?: Size
}

const ContainerDimensions = {
  small: 'w-3.5 h-3.5',
  medium: 'w-4 h-4',
  normal: 'w-5 h-5',
  large: 'w-6 h-6',
  custom: '',
}

const EmojiContainerDimensions = {
  small: 'w-4 h-4',
  medium: 'w-5 h-5',
  normal: 'w-5 h-5',
  large: 'w-7 h-6',
  custom: '',
}

const EmojiOffset = {
  small: '',
  medium: '',
  normal: '-mt-0.5',
  large: '',
  custom: '',
}

const EmojiSize = {
  small: 'text-xs',
  medium: 'text-sm',
  normal: 'text-base',
  large: 'text-lg',
  custom: '',
}

const getIconComponent = (type: VectorIconNameOrEmoji | LexicalIconName) => {
  return (
    IconNameToSvgMapping[type as keyof typeof IconNameToSvgMapping] ||
    LexicalIconNameToSvgMapping[type as LexicalIconName]
  )
}

export const isIconEmoji = (type: VectorIconNameOrEmoji): boolean => {
  return getIconComponent(type) == undefined
}

const Icon: FunctionComponent<Props> = ({ type, className = '', ariaLabel, size = 'normal', emojiSize }) => {
  const IconComponent = getIconComponent(type)
  if (!IconComponent) {
    return (
      <label
        className={classNames(
          'fill-current',
          'text-center',
          EmojiSize[emojiSize || size],
          EmojiContainerDimensions[emojiSize || size],
          EmojiOffset[emojiSize || size],
          className,
        )}
      >
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
