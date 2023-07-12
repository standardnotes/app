import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { KeyboardKey } from '@standardnotes/ui-services'
import { useState, useCallback, KeyboardEventHandler, useRef } from 'react'
import SearchOptions from '@/Components/SearchOptions/SearchOptions'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import { observer } from 'mobx-react-lite'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import { ElementIds } from '@/Constants/ElementIDs'

type Props = {
  itemListController: ItemListController
  searchOptionsController: SearchOptionsController
  hideOptions?: boolean
}

const SearchBar = ({ itemListController, searchOptionsController, hideOptions = false }: Props) => {
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
    <div className="pb-0.5 pt-3" role="search">
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
        onBlur={onSearchBlur}
        onChange={onNoteFilterTextChange}
        onFocus={onSearchFocus}
        onKeyUp={onNoteFilterKeyUp}
        left={[<Icon type="search" className="mr-1 h-4.5 w-4.5 flex-shrink-0 text-passive-1" />]}
        right={[noteFilterText && <ClearInputButton onClick={onClearSearch} />]}
        roundedFull
      />

      {(focusedSearch || noteFilterText) && !hideOptions && (
        <div className="animate-fade-from-top">
          <SearchOptions searchOptions={searchOptionsController} />
        </div>
      )}
    </div>
  )
}

export default observer(SearchBar)
