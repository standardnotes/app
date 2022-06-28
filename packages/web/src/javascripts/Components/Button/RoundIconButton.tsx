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
      className={`m-0 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-transparent bg-clip-padding text-neutral hover:bg-contrast hover:text-text focus:bg-contrast focus:text-text focus:outline-none focus:ring-info ${classes} ${
        className ?? ''
      }`}
      onClick={click}
    >
      <Icon type={iconType} />
    </button>
  )
}

export default RoundIconButton
