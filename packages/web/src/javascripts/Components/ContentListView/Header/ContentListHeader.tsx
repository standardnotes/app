import { WebApplication } from '@/Application/WebApplication'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../../Icon/Icon'
import { classNames } from '@standardnotes/utils'
import Popover from '@/Components/Popover/Popover'
import DisplayOptionsMenu from './DisplayOptionsMenu'
import { NavigationMenuButton } from '@/Components/NavigationMenu/NavigationMenu'
import { ApplicationEvent, isTag, VectorIconNameOrEmoji } from '@standardnotes/snjs'
import RoundIconButton from '@/Components/Button/RoundIconButton'
import { AnyTag } from '@/Controllers/Navigation/AnyTagType'
import { MediaQueryBreakpoints, MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import AddItemMenuButton from './AddItemMenuButton'
import { FilesController } from '@/Controllers/FilesController'
import SearchButton from './SearchButton'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { PaneController } from '@/Controllers/PaneController/PaneController'

type Props = {
  application: WebApplication
  panelTitle: string
  icon?: VectorIconNameOrEmoji
  addButtonLabel: string
  addNewItem: () => void
  isFilesSmartView: boolean
  isTableViewEnabled: boolean
  optionsSubtitle?: string
  selectedTag: AnyTag
  filesController: FilesController
  itemListController: ItemListController
  paneController: PaneController
}

const ContentListHeader = ({
  application,
  panelTitle,
  icon,
  addButtonLabel,
  addNewItem,
  isFilesSmartView,
  isTableViewEnabled,
  optionsSubtitle,
  selectedTag,
  filesController,
  itemListController,
  paneController,
}: Props) => {
  const displayOptionsContainerRef = useRef<HTMLDivElement>(null)
  const displayOptionsButtonRef = useRef<HTMLButtonElement>(null)
  const isDailyEntry = isTag(selectedTag) && selectedTag.isDailyEntry

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)
  const matchesMd = useMediaQuery(MediaQueryBreakpoints.md)
  const isTouchScreen = !useMediaQuery(MediaQueryBreakpoints.pointerFine)
  const isTablet = matchesMd && isTouchScreen

  const [syncSubtitle, setSyncSubtitle] = useState('')
  const [completedInitialSync, setCompletedInitialSync] = useState(false)
  const showSyncSubtitle = isMobileScreen && !!syncSubtitle

  useEffect(() => {
    return application.addEventObserver(async (event) => {
      if (event === ApplicationEvent.CompletedInitialSync) {
        setCompletedInitialSync(true)
        setSyncSubtitle('')
        return
      }

      const syncStatus = application.sync.getSyncStatus()
      const { localDataDone, localDataCurrent, localDataTotal } = syncStatus.getStats()

      if (event === ApplicationEvent.SyncStatusChanged) {
        setSyncSubtitle(syncStatus.syncInProgress && !completedInitialSync ? 'Syncing...' : '')
        return
      }

      if (event === ApplicationEvent.LocalDataIncrementalLoad || event === ApplicationEvent.LocalDataLoaded) {
        if (localDataDone) {
          setSyncSubtitle('')
          return
        }

        setSyncSubtitle(`Loading ${localDataCurrent}/${localDataTotal} items...`)
        return
      }
    })
  }, [application, completedInitialSync])

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
            title="Display options"
          >
            <DisplayOptionsMenu
              application={application}
              isFilesSmartView={isFilesSmartView}
              isOpen={showDisplayOptionsMenu}
              selectedTag={selectedTag}
              paneController={paneController}
            />
          </Popover>
        </div>
      </div>
    )
  }, [showDisplayOptionsMenu, toggleDisplayOptionsMenu, application, isFilesSmartView, selectedTag, paneController])

  const AddButton = useMemo(() => {
    return (
      <AddItemMenuButton
        isInFilesSmartView={isFilesSmartView}
        isDailyEntry={isDailyEntry}
        addButtonLabel={addButtonLabel}
        addNewItem={addNewItem}
        filesController={filesController}
      />
    )
  }, [addButtonLabel, addNewItem, filesController, isDailyEntry, isFilesSmartView])

  const SearchBarButton = useMemo(() => {
    if (!isTableViewEnabled || isMobileScreen) {
      return null
    }

    return <SearchButton itemListController={itemListController} />
  }, [isTableViewEnabled, isMobileScreen, itemListController])

  const FolderName = useMemo(() => {
    return (
      <div className="flex min-w-0 flex-grow flex-col break-words pt-1 lg:pt-0">
        <div
          className={classNames(
            'flex min-w-0 flex-grow flex-row',
            !optionsSubtitle && !showSyncSubtitle ? 'items-center' : '',
          )}
        >
          {icon && (
            <Icon
              type={icon}
              size="custom"
              className={classNames(
                'ml-0.5 mr-1.5 h-7 w-7 flex-shrink-0 text-2xl text-neutral lg:h-6 lg:w-6 lg:text-lg',
                optionsSubtitle && 'md:mt-0.5',
              )}
            />
          )}
          <div className="flex min-w-0 flex-grow flex-col break-words">
            <div className=" text-2xl font-semibold text-text md:text-lg">{panelTitle}</div>
            {showSyncSubtitle && <div className="text-xs text-passive-0">{syncSubtitle}</div>}
            {optionsSubtitle && <div className="text-xs text-passive-0">{optionsSubtitle}</div>}
          </div>
        </div>
      </div>
    )
  }, [optionsSubtitle, showSyncSubtitle, icon, panelTitle, syncSubtitle])

  const PhoneAndDesktopLayout = useMemo(() => {
    return (
      <div className={'flex w-full justify-between md:flex'}>
        <NavigationMenuButton />
        {FolderName}
        <div className="flex items-start gap-3 md:items-center">
          {SearchBarButton}
          {OptionsMenu}
          {AddButton}
        </div>
      </div>
    )
  }, [FolderName, SearchBarButton, OptionsMenu, AddButton])

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
