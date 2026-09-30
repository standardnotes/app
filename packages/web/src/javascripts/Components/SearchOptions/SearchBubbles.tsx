import Bubble from '@/Components/Bubble/Bubble'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'

type Props = {
  searchOptions: SearchOptionsController
}

const SearchBubbles = ({ searchOptions }: Props) => {
  const { includeProtectedContents, includeArchived, includeTrashed } = searchOptions

  const toggleIncludeProtectedContents = useCallback(async () => {
    await searchOptions.toggleIncludeProtectedContents()
  }, [searchOptions])

  return (
    <>
      <Bubble
        label="Protected Contents"
        selected={includeProtectedContents}
        onSelect={toggleIncludeProtectedContents}
      />
      <Bubble label="Archived" selected={includeArchived} onSelect={searchOptions.toggleIncludeArchived} />
      <Bubble label="Trashed" selected={includeTrashed} onSelect={searchOptions.toggleIncludeTrashed} />
    </>
  )
}

export default observer(SearchBubbles)
