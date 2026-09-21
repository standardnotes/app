import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { observer } from 'mobx-react-lite'
import EnhancedSearchOptionsContent from './EnhancedSearchOptionsContent'
import SearchBubbles from './SearchBubbles'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'

type Props = {
  searchOptions: SearchOptionsController
  showSearchEnhancements?: boolean
}

const SearchOptions = ({ searchOptions, showSearchEnhancements = false }: Props) => {
  void localizationStore.currentLocale

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
