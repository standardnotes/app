import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { observer } from 'mobx-react-lite'
import EnhancedSearchOptionsContent from './EnhancedSearchOptionsContent'
import SearchBubbles from './SearchBubbles'

type Props = {
  searchOptions: SearchOptionsController
  showSearchEnhancements?: boolean
}

const SearchOptions = ({ searchOptions, showSearchEnhancements = false }: Props) => {
  if (!showSearchEnhancements) {
    return (
      <div className="mt-3 flex flex-wrap gap-2" onMouseDown={(event) => event.preventDefault()}>
        <SearchBubbles searchOptions={searchOptions} />
      </div>
    )
  }

  return <EnhancedSearchOptionsContent searchOptions={searchOptions} className="mt-2" />
}

export default observer(SearchOptions)
