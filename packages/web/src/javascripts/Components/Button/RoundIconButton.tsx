import { ForwardedRef, forwardRef, MouseEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import { IconType } from '@standardnotes/snjs'
import { classNames } from '@/Utils/ConcatenateClassNames'

type Props = {
  onClick: () => void
  className?: string
  icon: IconType
  iconClassName?: string
  label: string
  id?: string
}

const RoundIconButton = forwardRef(
  ({ onClick, className, icon: iconType, iconClassName, id }: Props, ref: ForwardedRef<HTMLButtonElement>) => {
    const click: MouseEventHandler = (e) => {
      e.preventDefault()
      onClick()
    }
    return (
      <button
        className={classNames(
          'bg-text-padding m-0 flex h-8.5 min-w-8.5 cursor-pointer items-center justify-center rounded-full border border-solid border-border bg-clip-padding text-neutral hover:bg-contrast hover:text-text focus:bg-contrast focus:text-text focus:outline-none focus:ring-info md:h-8 md:min-w-8',
          className,
        )}
        onClick={click}
        ref={ref}
        id={id}
      >
        <Icon type={iconType} className={iconClassName} />
      </button>
    )
  },
)

export default RoundIconButton
