import { FunctionComponent } from 'preact'
import { Icon } from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'

interface Props {
  /**
   * onClick - preventDefault is handled within the component
   */
  onClick: () => void

  className?: string

  icon: IconType

  iconClassName?: string

  /**
   * Button tooltip
   */
  title: string

  focusable: boolean

  disabled?: boolean
}

/**
 * IconButton component with an icon
 * preventDefault is already handled within the component
 */
export const IconButton: FunctionComponent<Props> = ({
  onClick,
  className = '',
  icon,
  title,
  focusable,
  iconClassName = '',
  disabled = false,
}) => {
  const click = (e: MouseEvent) => {
    e.preventDefault()
    onClick()
  }
  const focusableClass = focusable ? '' : 'focus:shadow-none'
  return (
    <button
      type="button"
      title={title}
      className={`no-border cursor-pointer bg-transparent flex flex-row items-center ${focusableClass} ${className}`}
      onClick={click}
      disabled={disabled}
      aria-label={title}
    >
      <Icon type={icon} className={iconClassName} />
    </button>
  )
}
