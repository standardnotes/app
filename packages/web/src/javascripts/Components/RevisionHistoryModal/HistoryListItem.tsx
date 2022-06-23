import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FunctionComponent } from 'react'
import RadioIndicator from '../RadioIndicator/RadioIndicator'

type HistoryListItemProps = {
  isSelected: boolean
  onClick: () => void
}

const HistoryListItem: FunctionComponent<HistoryListItemProps> = ({ children, isSelected, onClick }) => {
  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={`sn-dropdown-item py-2.5 focus:bg-contrast focus:shadow-none ${isSelected ? 'bg-info-backdrop' : ''}`}
      onClick={onClick}
      data-selected={isSelected}
    >
      <RadioIndicator checked={isSelected} className="mr-2" />
      {children}
    </button>
  )
}

export default HistoryListItem
