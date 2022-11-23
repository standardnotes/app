import { WebApplication } from '@/Application/Application'
import { memo, useCallback, useMemo, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { classNames } from '@standardnotes/utils'
import Popover from '@/Components/Popover/Popover'
import DisplayOptionsMenu from './DisplayOptionsMenu'
import { NavigationMenuButton } from '@/Components/NavigationMenu/NavigationMenu'
import { IconType, isTag } from '@standardnotes/snjs'
import RoundIconButton from '@/Components/Button/RoundIconButton'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { MediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

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
  const isDailyEntry = isTag(selectedTag) && selectedTag.isDailyEntry

  const matchesMd = useMediaQuery(MediaQueryBreakpoints.md)
  const isTouchScreen = !useMediaQuery(MediaQueryBreakpoints.pointerFine)
  const isTablet = matchesMd && isTouchScreen

  const [showDisplayOptionsMenu, setShowDisplayOptionsMenu] = useState(false)

  const toggleDisplayOptionsMenu = useCallback(() => {
    setShowDisplayOptionsMenu((show) => !show)
  }, [])

  const OptionsMenu = useMemo(() => {
    return (
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
      </div>
    )
  }, [
    showDisplayOptionsMenu,
    toggleDisplayOptionsMenu,
    displayOptionsButtonRef,
    application,
    isFilesSmartView,
    selectedTag,
  ])

  const AddButton = useMemo(() => {
    return (
      <button
        className={classNames(
          'fixed bottom-6 right-6 z-editor-title-bar ml-3 flex h-15 w-15 cursor-pointer items-center',
          `justify-center rounded-full border border-solid border-transparent ${
            isDailyEntry ? 'bg-danger text-danger-contrast' : 'bg-info text-info-contrast'
          }`,
          'hover:brightness-125 md:static md:h-8 md:w-8',
        )}
        title={addButtonLabel}
        aria-label={addButtonLabel}
        onClick={addNewItem}
      >
        <Icon type="add" size="custom" className="h-8 w-8 md:h-5 md:w-5" />
      </button>
    )
  }, [addButtonLabel, addNewItem, isDailyEntry])

  const FolderName = useMemo(() => {
    return (
      <div className="flex min-w-0 flex-grow flex-col break-words pt-1 lg:pt-0">
        <div className={`flex min-w-0 flex-grow flex-row ${!optionsSubtitle ? 'items-center' : ''}`}>
          {icon && (
            <Icon
              type={icon as IconType}
              size={'custom'}
              className={` ml-0.5 mr-1.5 h-7 w-7 text-2xl text-neutral lg:h-6 lg:w-6 lg:text-lg ${
                optionsSubtitle ? 'mt-1' : ''
              }`}
            />
          )}
          <div className="flex min-w-0 flex-grow flex-col break-words">
            <div className=" text-2xl font-semibold text-text md:text-lg">{panelTitle}</div>
            {optionsSubtitle && <div className="text-xs text-passive-0">{optionsSubtitle}</div>}
          </div>
        </div>
      </div>
    )
  }, [optionsSubtitle, icon, panelTitle])

  const PhoneAndDesktopLayout = useMemo(() => {
    return (
      <div className={'flex w-full justify-between md:flex'}>
        <NavigationMenuButton />
        {FolderName}
        <div className="flex">
          {OptionsMenu}
          {AddButton}
        </div>
      </div>
    )
  }, [OptionsMenu, AddButton, FolderName])

  const TabletLayout = useMemo(() => {
    return (
      <div className={'w-full flex-col'}>
        <div className="mb-2 flex justify-between">
          <NavigationMenuButton />
          <div className="flex">
            {OptionsMenu}
            {AddButton}
          </div>
        </div>
        {FolderName}
      </div>
    )
  }, [OptionsMenu, AddButton, FolderName])

  return (
    <div className="section-title-bar-header items-start gap-1">
      {!isTablet && PhoneAndDesktopLayout}
      {isTablet && TabletLayout}
    </div>
  )
}

export default memo(ContentListHeader)
