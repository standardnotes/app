import { FunctionComponent, MouseEventHandler } from 'react'
import { Icon } from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'

type ButtonType = 'normal' | 'primary'

type Props = {
  onClick: () => void
  type: ButtonType
  className?: string
  icon: IconType
}

export const RoundIconButton: FunctionComponent<Props> = ({ onClick, type, className, icon: iconType }) => {
  const click: MouseEventHandler = (e) => {
    e.preventDefault()
    onClick()
  }
  const classes = type === 'primary' ? 'info ' : ''
  return (
    <button className={`sn-icon-button ${classes} ${className ?? ''}`} onClick={click}>
      <Icon type={iconType} />
    </button>
  )
}
