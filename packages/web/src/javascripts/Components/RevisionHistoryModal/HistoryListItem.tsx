import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { FunctionComponent, ReactNode } from 'react'
import RadioIndicator from '../Radio/RadioIndicator'

type HistoryListItemProps = {
  isSelected: boolean
  onClick: () => void
  children?: ReactNode
}

const HistoryListItem: FunctionComponent<HistoryListItemProps> = ({ children, isSelected, onClick }) => {
  return (
    <button
      tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
      className={`flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-2.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info-backdrop focus:shadow-none ${
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
