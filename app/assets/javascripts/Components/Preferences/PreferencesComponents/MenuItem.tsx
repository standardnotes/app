import { Icon } from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { IconType } from '@standardnotes/snjs'

interface Props {
  iconType: IconType
  label: string
  selected: boolean
  hasBubble?: boolean
  onClick: () => void
}

export const MenuItem: FunctionComponent<Props> = ({ iconType, label, selected, onClick, hasBubble }) => (
  <div
    className={`preferences-menu-item select-none ${selected ? 'selected' : ''}`}
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
  >
    <Icon className="icon" type={iconType} />
    <div className="min-w-1" />
    {label}
    {hasBubble && <span className="ml-1 color-warning">⚠️</span>}
  </div>
)
