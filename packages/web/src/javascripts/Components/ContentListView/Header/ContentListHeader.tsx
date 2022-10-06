import { WebApplication } from '@/Application/Application'
import { memo, useCallback, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Popover from '@/Components/Popover/Popover'
import DisplayOptionsMenu from './DisplayOptionsMenu'
import { NavigationMenuButton } from '@/Components/NavigationMenu/NavigationMenu'

type Props = {
  application: {
    getPreference: WebApplication['getPreference']
    setPreference: WebApplication['setPreference']
  }
  panelTitle: string
  addButtonLabel: string
  addNewItem: () => void
  isFilesSmartView: boolean
  optionsSubtitle?: string
}

const ContentListHeader = ({
  application,
  panelTitle,
  addButtonLabel,
  addNewItem,
  isFilesSmartView,
  optionsSubtitle,
}: Props) => {
  const displayOptionsContainerRef = useRef<HTMLDivElement>(null)
  const displayOptionsButtonRef = useRef<HTMLButtonElement>(null)

  const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false)

  const toggleDisplayOptionsMenu = useCallback(() => {
    setShowDisplayOptionsMenu((show) => !show)
  }, [])

  return (
    <div className="section-title-bar-header items-start gap-1 overflow-hidden">
      <NavigationMenuButton />
      <div className="flex min-w-0 flex-grow flex-col break-words">
        <div className="text-lg font-semibold text-text">{panelTitle}</div>
        {optionsSubtitle && <div className="text-xs text-passive-0">{optionsSubtitle}</div>}
      </div>
      <div className="flex">
        <div className="relative" ref={displayOptionsContainerRef}>
          <button
            className={classNames(
              'bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast',
              showDisplayOptionsMenu && 'bg-contrast',
            )}
            onClick={toggleDisplayOptionsMenu}
            ref={displayOptionsButtonRef}
          >
            <Icon type="sort-descending" />
          </button>
          <Popover
            open={showDisplayOptionsMenu}
            anchorElement={displayOptionsButtonRef.current}
            togglePopover={toggleDisplayOptionsMenu}
            align="start"
            className="py-2"
          >
            <DisplayOptionsMenu
              application={application}
              closeDisplayOptionsMenu={toggleDisplayOptionsMenu}
              isFilesSmartView={isFilesSmartView}
              isOpen={showDisplayOptionsMenu}
            />
          </Popover>
        </div>
        <button
          className="ml-3 flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-transparent bg-info text-info-contrast hover:brightness-125"
          title={addButtonLabel}
          aria-label={addButtonLabel}
          onClick={addNewItem}
        >
          <Icon type="add" />
        </button>
      </div>
    </div>
  )
}

export default memo(ContentListHeader)
