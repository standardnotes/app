import { observer } from 'mobx-react-lite'
import Bubble from '@/Components/Bubble/Bubble'
import Checkbox from '@/Components/Checkbox/Checkbox'
import { useCallback } from 'react'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { classNames } from '@standardnotes/snjs'

type SearchBubblesProps = {
  searchOptions: SearchOptionsController
}

const SearchBubbles = observer(({ searchOptions }: SearchBubblesProps) => {
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
})

type Props = {
  searchOptions: SearchOptionsController
  showNoteTitleOnlyOption?: boolean
}

const SearchOptions = ({ searchOptions, showNoteTitleOnlyOption = false }: Props) => {
  const { noteTitleOnly } = searchOptions

  if (!showNoteTitleOnlyOption) {
    return (
      <div className="mt-3 flex flex-wrap gap-2" onMouseDown={(e) => e.preventDefault()}>
        <SearchBubbles searchOptions={searchOptions} />
      </div>
    )
  }

  return (
    <div className={classNames('mt-2 flex flex-col')} onMouseDown={(e) => e.preventDefault()}>
      <Checkbox
        name="search-note-title-only"
        label="Search titles only"
        checked={noteTitleOnly}
        onChange={(event) => searchOptions.setNoteTitleOnly(event.target.checked)}
      />

      <div className="flex flex-wrap gap-2">
        <SearchBubbles searchOptions={searchOptions} />
      </div>
    </div>
  )
}

export default observer(SearchOptions)
