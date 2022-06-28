import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { KeyboardKey } from '@/Services/IOService'
import { useState, useCallback, KeyboardEventHandler, useRef } from 'react'
import SearchOptions from '@/Components/SearchOptions/SearchOptions'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import { observer } from 'mobx-react-lite'

type Props = {
  itemListController: ItemListController
  searchOptionsController: SearchOptionsController
}

const SearchBar = ({ itemListController, searchOptionsController }: Props) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { noteFilterText, setNoteFilterText, clearFilterText, onFilterEnter } = itemListController

  const [focusedSearch, setFocusedSearch] = useState(false)

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

  const onSearchFocus = useCallback(() => setFocusedSearch(true), [])
  const onSearchBlur = useCallback(() => setFocusedSearch(false), [])

  const onClearSearch = useCallback(() => {
    clearFilterText()
    searchInputRef.current?.focus()
  }, [clearFilterText])

  return (
    <div className="px-2.5 pt-2.5 pb-0.5" role="search">
      <DecoratedInput
        autocomplete={false}
        title="Searches notes and files in the currently selected tag"
        className="placeholder:color-passive-0 bg-contrast rounded-full bg-clip-padding px-1"
        placeholder="Search"
        value={noteFilterText}
        ref={searchInputRef}
        onBlur={onSearchBlur}
        onChange={onNoteFilterTextChange}
        onFocus={onSearchFocus}
        onKeyUp={onNoteFilterKeyUp}
        left={[<Icon type="search" className="h-4.5 w-4.5 text-passive-1 mr-1 flex-shrink-0" />]}
        right={[
          noteFilterText && (
            <button
              onClick={onClearSearch}
              className="h-4.5 w-4.5 bg-neutral text-neutral-contrast flex items-center justify-center rounded-full border-0"
            >
              <Icon type="close" className="h-3.5 w-3.5" />
            </button>
          ),
        ]}
        roundedFull
      />

      {(focusedSearch || noteFilterText) && (
        <div className="animate-fade-from-top">
          <SearchOptions searchOptions={searchOptionsController} />
        </div>
      )}
    </div>
  )
}

export default observer(SearchBar)
