import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useCallback, KeyboardEventHandler, useRef, useState } from 'react'
import SearchOptions from '@/Components/SearchOptions/SearchOptions'
import SearchFilterSheet from '@/Components/SearchOptions/SearchFilterSheet'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import { observer } from 'mobx-react-lite'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import { ElementIds } from '@/Constants/ElementIDs'
import { classNames } from '@standardnotes/snjs'

type Props = {
  itemListController: ItemListController
  searchOptionsController: SearchOptionsController
  hideOptions?: boolean
  showSearchEnhancements?: boolean
}

type SearchFilterButtonProps = {
  activeFilterCount: number
  isOpen: boolean
  onClick: () => void
}

const SearchFilterButton = ({ activeFilterCount, isOpen, onClick }: SearchFilterButtonProps) => (
  <button
    type="button"
    className={classNames(
      'relative flex flex-shrink-0 cursor-pointer border-0 bg-transparent p-0',
      isOpen ? 'text-info' : 'text-passive-1 hover:text-info',
    )}
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    aria-label="Search filters"
    aria-expanded={isOpen}
  >
    <Icon type="tune" className="h-4.5 w-4.5" />
    {activeFilterCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-info px-0.5 text-[10px] font-semibold leading-none text-info-contrast">
        {activeFilterCount}
      </span>
    )}
  </button>
)

const SearchBar = ({
  itemListController,
  searchOptionsController,
  hideOptions = false,
  showSearchEnhancements = false,
}: Props) => {
  const searchBarRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)
  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const { noteFilterText, setNoteFilterText, clearFilterText, onFilterEnter } = itemListController
  const { activeSearchFilterCount } = searchOptionsController

  const onNoteFilterTextChange = useCallback(
    (text: string) => {
      setNoteFilterText(text)
    },
    [setNoteFilterText],
  )

  const onNoteFilterKeyUp: KeyboardEventHandler = useCallback(
    (e) => {
      if (e.key === KeyboardKey.Enter) {
        onFilterEnter()
      }
    },
    [onFilterEnter],
  )

  const onClearSearch = useCallback(() => {
    clearFilterText()
    searchInputRef.current?.focus()
  }, [clearFilterText])

  const toggleFilterPanel = useCallback(() => {
    setIsFilterPanelOpen((current) => !current)
  }, [])

  const closeFilterPanel = useCallback(() => {
    setIsFilterPanelOpen(false)
  }, [])

  const searchOptionsVisibilityClass = (() => {
    if (hideOptions) {
      return 'hidden'
    }

    if (showSearchEnhancements) {
      if (isMobileScreen) {
        return 'hidden'
      }

      return isFilterPanelOpen ? 'flex' : 'hidden'
    }

    if (!noteFilterText) {
      return 'hidden group-focus-within:flex'
    }

    return undefined
  })()

  const rightDecorations = showSearchEnhancements
    ? [
        <div key="search-actions" className="flex items-center gap-1">
          {noteFilterText && <ClearInputButton onClick={onClearSearch} />}
          <SearchFilterButton
            activeFilterCount={activeSearchFilterCount}
            isOpen={isFilterPanelOpen}
            onClick={toggleFilterPanel}
          />
        </div>,
      ]
    : [noteFilterText && <ClearInputButton key="clear-search" onClick={onClearSearch} />].filter(Boolean)

  return (
    <div className="group pb-0.5 pt-3" role="search" ref={searchBarRef}>
      <DecoratedInput
        autocomplete={false}
        id={ElementIds.SearchBar}
        className={{
          container: 'px-1',
          input: 'text-base placeholder:text-passive-0 lg:text-sm',
        }}
        placeholder={'Search...'}
        value={noteFilterText}
        ref={searchInputRef}
        onChange={onNoteFilterTextChange}
        onKeyUp={onNoteFilterKeyUp}
        left={[<Icon type="search" className="mr-1 h-4.5 w-4.5 flex-shrink-0 text-passive-1" />]}
        right={rightDecorations}
        roundedFull
      />

      <div className={classNames('animate-fade-from-top w-full', searchOptionsVisibilityClass)}>
        <SearchOptions searchOptions={searchOptionsController} showSearchEnhancements={showSearchEnhancements} />
      </div>

      {showSearchEnhancements && isMobileScreen && (
        <SearchFilterSheet
          open={isFilterPanelOpen && !hideOptions}
          onClose={closeFilterPanel}
          searchOptions={searchOptionsController}
        />
      )}
    </div>
  )
}

export default observer(SearchBar)
