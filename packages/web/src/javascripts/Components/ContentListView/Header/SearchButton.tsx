import RoundIconButton from '@/Components/Button/RoundIconButton'
import ClearInputButton from '@/Components/ClearInputButton/ClearInputButton'
import Icon from '@/Components/Icon/Icon'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { ElementIds } from '@/Constants/ElementIDs'
import { ItemListController } from '@/Controllers/ItemList/ItemListController'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'

type Props = {
  itemListController: ItemListController
}

const SearchButton = ({ itemListController }: Props) => {
  const { noteFilterText, setNoteFilterText, clearFilterText } = itemListController

  const [isSearchBarVisible, setIsSearchBarVisible] = useState(false)

  return (
    <>
      {isSearchBarVisible && (
        <DecoratedInput
          autocomplete={false}
          id={ElementIds.SearchBar}
          className={{
            container: 'px-1',
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
      )}
      <RoundIconButton
        onClick={() => {
          setIsSearchBarVisible(!isSearchBarVisible)
        }}
        icon={isSearchBarVisible ? 'close' : 'search'}
        label="Display options menu"
      />
    </>
  )
}

export default observer(SearchButton)
