import { FunctionComponent, MouseEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/icons'

type Props = {
  onClick: () => void
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
  const click: MouseEventHandler = (e) => {
    e.preventDefault()
    onClick()
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
