import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { IconType, classNames } from '@standardnotes/snjs'
import { ErrorCircle } from '@/Components/UIElements/ErrorCircle'

interface Props {
  iconType: IconType
  label: string
  selected: boolean
  bubbleCount?: number
  hasErrorIndicator?: boolean
  onClick: () => void
}

const PreferencesMenuItem: FunctionComponent<Props> = ({
  iconType,
  label,
  selected,
  onClick,
  bubbleCount,
  hasErrorIndicator,
}) => (
  <div
    className={`preferences-menu-item box-border flex h-auto w-auto min-w-42 cursor-pointer select-none flex-row items-center justify-start rounded border border-solid px-4 py-2 text-sm hover:border-border hover:bg-default ${
      selected ? 'selected border-info font-bold text-info' : 'border-transparent'
    }`}
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
  >
    <div className="relative">
      <Icon className={classNames('text-base', selected ? 'text-info' : 'text-neutral')} type={iconType} />
      {bubbleCount ? (
        <div className="absolute bottom-full left-full flex aspect-square h-4 w-4 -translate-x-3 translate-y-2 items-center justify-center rounded-full border border-info-contrast bg-info text-[0.5rem] font-bold text-info-contrast">
          {bubbleCount}
        </div>
      ) : null}
    </div>
    <div className="min-w-1" />
    {label}
    {hasErrorIndicator && (
      <span className="ml-2">
        <ErrorCircle />
      </span>
    )}
  </div>
)

export default PreferencesMenuItem
