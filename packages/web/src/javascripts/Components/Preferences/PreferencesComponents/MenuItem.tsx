import Icon from '@/Components/Icon/Icon'
import { FunctionComponent } from 'react'
import { IconType } from '@standardnotes/snjs'

interface Props {
  iconType: IconType
  label: string
  selected: boolean
  hasBubble?: boolean
  onClick: () => void
}

const PreferencesMenuItem: FunctionComponent<Props> = ({ iconType, label, selected, onClick, hasBubble }) => (
  <div
    className={`preferences-menu-item box-border w-auto h-auto rounded min-w-42 py-2 px-4 flex flex-row items-center justify-start text-sm cursor-pointer border-solid border select-none hover:border-border hover:bg-default ${
      selected ? 'selected border-info text-info font-bold' : 'border-transparent'
    }`}
    onClick={(e) => {
      e.preventDefault()
      onClick()
    }}
  >
    <Icon className={`icon text-base ${selected ? 'text-info' : 'text-neutral'}`} type={iconType} />
    <div className="min-w-1" />
    {label}
    {hasBubble && <span className="ml-1 text-warning">⚠️</span>}
  </div>
)

export default PreferencesMenuItem
