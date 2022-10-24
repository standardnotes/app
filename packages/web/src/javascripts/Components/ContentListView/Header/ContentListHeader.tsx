import { WebApplication } from '@/Application/Application'
import { memo, useCallback, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { classNames } from '@/Utils/ConcatenateClassNames'
import Popover from '@/Components/Popover/Popover'
import DisplayOptionsMenu from './DisplayOptionsMenu'
import { NavigationMenuButton } from '@/Components/NavigationMenu/NavigationMenu'
import { IconType } from '@standardnotes/snjs'
import RoundIconButton from '@/Components/Button/RoundIconButton'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'

type Props = {
  application: WebApplication
  panelTitle: string
  icon?: IconType | string
  addButtonLabel: string
  addNewItem: () => void
  isFilesSmartView: boolean
  optionsSubtitle?: string
  selectedTag: AnyTag
}

const ContentListHeader = ({
  application,
  panelTitle,
  icon,
  addButtonLabel,
  addNewItem,
  isFilesSmartView,
  optionsSubtitle,
  selectedTag,
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
        <div className={`flex min-w-0 flex-grow flex-row ${!optionsSubtitle ? 'items-center' : ''}`}>
          {icon && (
            <Icon
              type={icon as IconType}
              size={'large'}
              className={`ml-0.5 mr-1.5 text-neutral ${optionsSubtitle ? 'mt-1' : ''}`}
            />
          )}
          <div className="flex min-w-0 flex-grow flex-col break-words">
            <div className="text-lg font-semibold text-text">{panelTitle}</div>
            {optionsSubtitle && <div className="text-xs text-passive-0">{optionsSubtitle}</div>}
          </div>
        </div>
      </div>
      <div className="flex">
        <div className="relative" ref={displayOptionsContainerRef}>
          <RoundIconButton
            className={classNames(showDisplayOptionsMenu && 'bg-contrast')}
            onClick={toggleDisplayOptionsMenu}
            ref={displayOptionsButtonRef}
            icon="sort-descending"
            label="Display options menu"
          />
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
              selectedTag={selectedTag}
            />
          </Popover>
        </div>
        <button
          className="absolute bottom-6 right-6 z-editor-title-bar ml-3 flex h-13 w-13 cursor-pointer items-center justify-center rounded-full border border-solid border-transparent bg-info text-info-contrast hover:brightness-125 md:static md:h-8 md:w-8"
          title={addButtonLabel}
          aria-label={addButtonLabel}
          onClick={addNewItem}
        >
          <Icon type="add" size="custom" className="h-6 w-6 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  )
}

export default memo(ContentListHeader)
