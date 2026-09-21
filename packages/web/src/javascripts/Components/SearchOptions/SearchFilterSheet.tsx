import MobilePopoverContent from '@/Components/Popover/MobilePopoverContent'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import EnhancedSearchOptionsContent from './EnhancedSearchOptionsContent'
import { c } from 'ttag'
import { localizationStore } from '@/Controllers/Localization/LocalizationStore'

type Props = {
  open: boolean
  onClose: () => void
  searchOptions: SearchOptionsController
}

const SearchFilterSheet = ({ open, onClose, searchOptions }: Props) => {
  void localizationStore.currentLocale

  const addAndroidBackHandler = useAndroidBackHandler()

  useEffect(() => {
    if (!open) {
      return
    }

    return addAndroidBackHandler(() => {
      onClose()
      return true
    })
  }, [addAndroidBackHandler, onClose, open])

  return (
    <MobilePopoverContent
      open={open}
      requestClose={onClose}
      title={c('B3.Notes.NoteList.Title').t`Search filters`}
      id="search-filters"
      className="p-4"
    >
      <EnhancedSearchOptionsContent searchOptions={searchOptions} />
    </MobilePopoverContent>
  )
}

export default observer(SearchFilterSheet)
