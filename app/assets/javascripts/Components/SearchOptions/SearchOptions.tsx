import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { WebApplication } from '@/Application/Application'
import { observer } from 'mobx-react-lite'
import Bubble from '@/Components/Bubble/Bubble'
import { useCallback } from 'react'

type Props = {
  viewControllerManager: ViewControllerManager
  application: WebApplication
}

const SearchOptions = ({ viewControllerManager }: Props) => {
  const { searchOptionsController: searchOptions } = viewControllerManager

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
