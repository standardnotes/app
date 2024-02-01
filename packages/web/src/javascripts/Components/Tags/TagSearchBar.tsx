import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import { observer } from 'mobx-react-lite'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import { useCallback } from 'react'

type Props = {
  navigationController: NavigationController
}

const TagSearchBar = ({ navigationController }: Props) => {
  const { searchQuery, setSearchQuery } = navigationController

  const onClearSearch = useCallback(() => {
    setSearchQuery('')
  }, [setSearchQuery])

  return (
    <div className="sticky top-0 bg-[inherit] px-4 pt-4" role="search">
      <DecoratedInput
        autocomplete={false}
        className={{
          container: '!bg-default px-1',
          input: 'text-base placeholder:text-passive-0 lg:text-sm',
        }}
        placeholder={'Search tags...'}
        value={searchQuery}
        onChange={setSearchQuery}
        left={[<Icon type="search" className="mr-1 h-4.5 w-4.5 flex-shrink-0 text-passive-1" />]}
        right={[searchQuery && <ClearInputButton onClick={onClearSearch} />]}
        roundedFull
      />
    </div>
  )
}

export default observer(TagSearchBar)
