import MobilePopoverContent from '@/Components/Popover/MobilePopoverContent'
import { SearchOptionsController } from '@/Controllers/SearchOptionsController'
import { useAndroidBackHandler } from '@/NativeMobileWeb/useAndroidBackHandler'
import { observer } from 'mobx-react-lite'
import { useEffect } from 'react'
import EnhancedSearchOptionsContent from './EnhancedSearchOptionsContent'

type Props = {
  open: boolean
  onClose: () => void
  searchOptions: SearchOptionsController
}

const SearchFilterSheet = ({ open, onClose, searchOptions }: Props) => {
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
    <MobilePopoverContent open={open} requestClose={onClose} title="Search filters" id="search-filters" className="p-4">
      <EnhancedSearchOptionsContent searchOptions={searchOptions} />
    </MobilePopoverContent>
  )
}

export default observer(SearchFilterSheet)
