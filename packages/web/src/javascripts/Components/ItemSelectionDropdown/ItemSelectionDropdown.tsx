import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { doesItemMatchSearchQuery } from '@/Utils/Items/Search/doesItemMatchSearchQuery'
import { Disclosure, DisclosurePanel } from '@reach/disclosure'
import { classNames, ContentType, DecryptedItem, naturalSort } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { ChangeEventHandler, FocusEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { useApplication } from '../ApplicationProvider'
import LinkedItemMeta from '../LinkedItems/LinkedItemMeta'
import Menu from '../Menu/Menu'

type Props = {
  contentTypes: ContentType[]
  placeholder: string
  onSelection: (item: DecryptedItem) => void
}

const ItemSelectionDropdown = ({ contentTypes, placeholder, onSelection }: Props) => {
  const application = useApplication()

  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | 'auto'>('auto')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchResultsMenuRef = useRef<HTMLMenuElement>(null)
  const [items, setItems] = useState<DecryptedItem[]>([])

  const showDropdown = () => {
    const { clientHeight } = document.documentElement
    const inputRect = inputRef.current?.getBoundingClientRect()
    if (inputRect) {
      setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2)
      setDropdownVisible(true)
    }
  }

  const [closeOnBlur] = useCloseOnBlur(containerRef, (visible: boolean) => {
    setDropdownVisible(visible)
    setSearchQuery('')
  })

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
  }

  const onSearchQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchQuery(event.currentTarget.value)
  }

  const handleFocus = () => {
    showDropdown()
  }

  useEffect(() => {
    const searchableItems = naturalSort(application.items.getItems(contentTypes), 'title')
    const filteredItems = searchableItems.filter((item) => {
      return doesItemMatchSearchQuery(item, searchQuery, application)
    })
    setItems(filteredItems)
  }, [searchQuery, application, contentTypes])

  const onSelectItem = useCallback(
    (item: DecryptedItem) => {
      onSelection(item)
      setSearchQuery('')
      setDropdownVisible(false)
    },
    [onSelection],
  )

  return (
    <div className="relative" ref={containerRef}>
      <Disclosure open={dropdownVisible} onChange={showDropdown}>
        <input
          ref={inputRef}
          className={classNames(
            'mr-10 w-70',
            'bg-transparent text-sm text-text focus:border-b-2 focus:border-solid focus:border-info lg:text-xs',
            'no-border h-7 focus:shadow-none focus:outline-none',
          )}
          value={searchQuery}
          onChange={onSearchQueryChange}
          type="text"
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={onBlur}
          autoComplete="off"
        />

        {dropdownVisible && (
          <DisclosurePanel
            className={classNames(
              'mr-10 w-70',
              'absolute z-dropdown-menu flex flex-col overflow-y-auto rounded bg-default py-2 shadow-main',
            )}
            style={{
              maxHeight: dropdownMaxHeight,
            }}
            tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            onBlur={closeOnBlur}
          >
            <Menu
              isOpen={dropdownVisible}
              a11yLabel="Tag search results"
              ref={searchResultsMenuRef}
              shouldAutoFocus={false}
            >
              {items.map((item) => {
                return (
                  <button
                    key={item.uuid}
                    className={classNames(
                      'flex w-full items-center justify-between gap-4 overflow-hidden py-2 px-3 hover:bg-contrast',
                      'hover:text-foreground focus:bg-info-backdrop',
                    )}
                    onClick={() => onSelectItem(item)}
                  >
                    <LinkedItemMeta item={item} searchQuery={searchQuery} />
                  </button>
                )
              })}
            </Menu>
          </DisclosurePanel>
        )}
      </Disclosure>
    </div>
  )
}

export default observer(ItemSelectionDropdown)
