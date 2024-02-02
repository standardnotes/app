import { NavigationController } from '@/Controllers/Navigation/NavigationController'
import Icon from '../Icon/Icon'
import DecoratedInput from '../Input/DecoratedInput'
import { observer } from 'mobx-react-lite'
import ClearInputButton from '../ClearInputButton/ClearInputButton'
import { useCallback, useEffect, useRef, useState } from 'react'
import { classNames } from '@standardnotes/snjs'

type Props = {
  navigationController: NavigationController
}

const TagSearchBar = ({ navigationController }: Props) => {
  const { searchQuery, setSearchQuery } = navigationController

  const inputRef = useRef<HTMLInputElement>(null)

  const onClearSearch = useCallback(() => {
    setSearchQuery('')
    inputRef.current?.focus()
  }, [setSearchQuery])

  const [isParentScrolling, setIsParentScrolling] = useState(false)
  const searchBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchBar = searchBarRef.current
    if (!searchBar) {
      return
    }

    const parent = searchBar.parentElement
    if (!parent) {
      return
    }

    const scrollListener = () => {
      const { scrollTop } = parent
      setIsParentScrolling(scrollTop > 0)
    }

    parent.addEventListener('scroll', scrollListener)

    return () => {
      parent.removeEventListener('scroll', scrollListener)
    }
  }, [])

  return (
    <div
      className={classNames(
        'sticky top-0 bg-[inherit] px-4 pt-4',
        isParentScrolling &&
          'after:absolute after:left-0 after:top-full after:-z-[1] after:block after:h-4 after:w-full after:border-b after:border-border after:bg-[inherit]',
      )}
      role="search"
      ref={searchBarRef}
    >
      <DecoratedInput
        ref={inputRef}
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
