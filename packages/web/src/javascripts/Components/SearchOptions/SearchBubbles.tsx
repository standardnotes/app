import Bubble from '@/Components/Bubble/Bubble'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import { c } from 'ttag'
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
        label={c('B3.Notes.NoteList.Label').t`Protected Contents`}
        selected={includeProtectedContents}
        onSelect={toggleIncludeProtectedContents}
      />
      <Bubble
        label={c('B3.Notes.NoteList.Action').t`Archived`}
        selected={includeArchived}
        onSelect={searchOptions.toggleIncludeArchived}
      />
      <Bubble
        label={c('B3.Notes.NoteList.Action').t`Trashed`}
        selected={includeTrashed}
        onSelect={searchOptions.toggleIncludeTrashed}
      />
    </>
  )
}

export default observer(SearchBubbles)
