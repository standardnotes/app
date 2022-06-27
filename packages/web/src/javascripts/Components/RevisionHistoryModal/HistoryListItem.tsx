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
      className={`flex items-center border-0 cursor-pointer hover:bg-contrast hover:text-foreground text-text bg-transparent px-3 py-2.5 text-left w-full focus:bg-info-backdrop focus:shadow-none text-sm ${
        isSelected ? 'bg-info-backdrop' : ''
      }`}
      onClick={onClick}
      data-selected={isSelected}
    >
      <RadioIndicator checked={isSelected} className="mr-2" />
      {children}
    </button>
  )
}

export default HistoryListItem
