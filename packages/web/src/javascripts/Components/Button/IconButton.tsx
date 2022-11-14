import { FunctionComponent, MouseEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'

type Props = {
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
  icon: IconType
  iconClassName?: string
  title: string
  focusable: boolean
  disabled?: boolean
}

const IconButton: FunctionComponent<Props> = ({
  onClick,
  className = '',
  icon,
  title,
  focusable,
  iconClassName = '',
  disabled = false,
}) => {
  const click: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    onClick(e)
  }
  const focusableClass = focusable ? '' : 'focus:shadow-none'
  return (
    <button
      type="button"
      title={title}
      className={`no-border flex cursor-pointer flex-row items-center bg-transparent ${focusableClass} ${className}`}
      onClick={click}
      disabled={disabled}
      aria-label={title}
    >
      <Icon type={icon} className={iconClassName} />
    </button>
  )
}

export default IconButton
