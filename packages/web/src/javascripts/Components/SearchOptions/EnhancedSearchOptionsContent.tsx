import Checkbox from '@/Components/Checkbox/Checkbox'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { classNames } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { useCallback } from 'react'
import SearchBubbles from './SearchBubbles'
import SearchOptionsSection, { ClearFilterButton } from './SearchOptionsSection'
import SearchTagFilters from './SearchTagFilters'

type Props = {
  searchOptions: SearchOptionsController
  className?: string
}

const EnhancedSearchOptionsContent = ({ searchOptions, className }: Props) => {
  const { noteTitleOnly, tagFilterList, activeSearchFilterCount } = searchOptions

  const clearAllTagFilters = useCallback(() => {
    searchOptions.clearTagFilters()
  }, [searchOptions])

  const clearAllFilters = useCallback(() => {
    searchOptions.clearAllFilters()
  }, [searchOptions])

  return (
    <div className={classNames('flex w-full flex-col gap-2', className)}>
      <div className="flex flex-col gap-2" onMouseDown={(event) => event.preventDefault()}>
        <div className="flex items-start justify-between gap-2">
          <Checkbox
            name="search-note-title-only"
            label="Search titles only"
            checked={noteTitleOnly}
            onChange={(event) => searchOptions.setNoteTitleOnly(event.target.checked)}
          />
          {activeSearchFilterCount > 0 && (
            <ClearFilterButton onClick={clearAllFilters}>Clear all filters</ClearFilterButton>
          )}
        </div>

        <SearchOptionsSection label="Include">
          <div className="flex flex-wrap gap-2">
            <SearchBubbles searchOptions={searchOptions} />
          </div>
        </SearchOptionsSection>
      </div>

      <SearchOptionsSection
        label="Filter by tag"
        action={
          tagFilterList.length > 0 ? (
            <ClearFilterButton onClick={clearAllTagFilters}>Clear tag filters</ClearFilterButton>
          ) : undefined
        }
      >
        <SearchTagFilters searchOptions={searchOptions} />
      </SearchOptionsSection>
    </div>
  )
}

export default observer(EnhancedSearchOptionsContent)
