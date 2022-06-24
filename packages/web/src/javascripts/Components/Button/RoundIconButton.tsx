import { FunctionComponent, MouseEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'

type ButtonType = 'normal' | 'primary'

type Props = {
  onClick: () => void
  type: ButtonType
  className?: string
  icon: IconType
}

const RoundIconButton: FunctionComponent<Props> = ({ onClick, type, className, icon: iconType }) => {
  const click: MouseEventHandler = (e) => {
    e.preventDefault()
    onClick()
  }
  const classes = type === 'primary' ? 'info ' : ''
  return (
    <button
      className={`text-neutral min-w-8 h-8 flex justify-center items-center border-solid border border-border bg-clip-padding m-0 bg-transparent cursor-pointer rounded-full hover:text-text focus:text-text hover:bg-contrast focus:bg-contrast focus:outline-none focus:ring-info ${classes} ${
        className ?? ''
      }`}
      onClick={click}
    >
      <Icon type={iconType} />
    </button>
  )
}

export default RoundIconButton
