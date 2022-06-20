import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import Bubble from '@/Components/Bubble/Bubble'
import { useCallback } from 'react'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'

type Props = {
  application: WebApplication
  searchOptions: SearchOptionsController
}

const SearchOptions = ({ searchOptions }: Props) => {
  const { includeProtectedContents, includeArchived, includeTrashed } = searchOptions

  const toggleIncludeProtectedContents = useCallback(async () => {
    await searchOptions.toggleIncludeProtectedContents()
  }, [searchOptions])

  return (
    <div role="tablist" className="search-options justify-center" onMouseDown={(e) => e.preventDefault()}>
      <Bubble
        label="Protected Contents"
        selected={includeProtectedContents}
        onSelect={toggleIncludeProtectedContents}
      />

      <Bubble label="Archived" selected={includeArchived} onSelect={searchOptions.toggleIncludeArchived} />

      <Bubble label="Trashed" selected={includeTrashed} onSelect={searchOptions.toggleIncludeTrashed} />
    </div>
  )
}

export default observer(SearchOptions)
