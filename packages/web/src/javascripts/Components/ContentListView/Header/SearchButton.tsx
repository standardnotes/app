import RoundIconButton from '@/Components/Button/RoundIconButton'
import ClearInputButton from '@/Components/ClearInputButton/ClearInputButton'
import Icon from '@/Components/Icon/Icon'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { ElementIds } from '@/Constants/ElementIDs'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useRef, useState } from 'react'

type Props = {
  itemListController: ItemListController
}

const SearchButton = ({ itemListController }: Props) => {
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const { noteFilterText, setNoteFilterText, clearFilterText } = itemListController

  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false)

  return (
    <>
      <DecoratedInput
        autocomplete={false}
        id={ElementIds.SearchBar}
        className={{
          container: classNames(
            isSearchBarVisible ? 'scale-x-1 opacity-100' : 'scale-x-0 opacity-0',
            'origin-right px-1 transition-all duration-200 ease-in-out',
          ),
          input: 'text-base placeholder:text-passive-0 lg:text-sm',
        }}
        placeholder={'Search...'}
        value={noteFilterText}
        ref={(node) => {
          if (node && document.activeElement !== node) {
            node.focus()
          }
        }}
        onChange={(query) => setNoteFilterText(query)}
        left={[<Icon type="search" className="mr-1 h-4.5 w-4.5 flex-shrink-0 text-passive-1" />]}
        right={[noteFilterText && <ClearInputButton onClick={clearFilterText} />]}
        roundedFull
      />
      <RoundIconButton
        ref={searchButtonRef}
        className={isSearchBarVisible ? 'rotate-90 transition-transform duration-200 ease-in-out' : ''}
        onClick={() => {
          setIsSearchBarVisible(!isSearchBarVisible)
        }}
        icon={isSearchBarVisible ? 'close' : 'search'}
        label="Search"
      />
    </>
  )
}

export default observer(SearchButton)
