import {
  ChangeEventHandler,
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Disclosure, DisclosurePanel } from '@reach/disclosure'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { observer } from 'mobx-react-lite'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import LinkedItemSearchResults from './LinkedItemSearchResults'
import { LinkingController } from '@/Controllers/LinkingController'
import { KeyboardKey } from '@standardnotes/ui-services'
import { ElementIds } from '@/Constants/ElementIDs'
import Menu from '../Menu/Menu'

type Props = {
  linkingController: LinkingController
  focusPreviousItem: () => void
  focusedId: string | undefined
}

const ItemLinkAutocompleteInput = ({ linkingController, focusPreviousItem, focusedId }: Props) => {
  const {
    tags,
    getTitleForLinkedTag,
    getLinkedItemIcon,
    getSearchResults,
    linkItemToSelectedItem,
    createAndAddNewTag,
    isEntitledToNoteLinking,
  } = linkingController

  const [searchQuery, setSearchQuery] = useState('')
  const { unlinkedResults, shouldShowCreateTag } = getSearchResults(searchQuery)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | 'auto'>('auto')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchResultsMenuRef = useRef<HTMLMenuElement>(null)

  const [closeOnBlur] = useCloseOnBlur(containerRef, (visible: boolean) => {
    setDropdownVisible(visible)
    setSearchQuery('')
  })

  const showDropdown = () => {
    const { clientHeight } = document.documentElement
    const inputRect = inputRef.current?.getBoundingClientRect()
    if (inputRect) {
      setDropdownMaxHeight(clientHeight - inputRect.bottom - 32 * 2)
      setDropdownVisible(true)
    }
  }

  const onSearchQueryChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchQuery(event.currentTarget.value)
  }

  const onFormSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (searchQuery !== '') {
      await createAndAddNewTag(searchQuery)
    }
  }

  const handleFocus = () => {
    showDropdown()
  }

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case KeyboardKey.Left:
        if (searchQuery.length === 0) {
          focusPreviousItem()
        }
        break
      case KeyboardKey.Down:
        if (searchQuery.length > 0) {
          searchResultsMenuRef.current?.focus()
        }
        break
    }
  }

  useEffect(() => {
    if (focusedId === ElementIds.ItemLinkAutocompleteInput) {
      inputRef.current?.focus()
    }
  }, [focusedId])

  const areSearchResultsVisible = dropdownVisible && (unlinkedResults.length > 0 || shouldShowCreateTag)

  const handleMenuKeyDown: KeyboardEventHandler<HTMLMenuElement> = useCallback((event) => {
    if (event.key === KeyboardKey.Escape) {
      inputRef.current?.focus()
    }
  }, [])

  return (
    <div ref={containerRef}>
      <form onSubmit={onFormSubmit}>
        <Disclosure open={dropdownVisible} onChange={showDropdown}>
          <input
            ref={inputRef}
            className={`${tags.length > 0 ? 'w-80' : 'mr-10 w-70'} no-border h-7
            bg-transparent text-xs text-text focus:border-b-2 focus:border-solid focus:border-info focus:shadow-none focus:outline-none`}
            value={searchQuery}
            onChange={onSearchQueryChange}
            type="text"
            placeholder="Link tags, notes, files..."
            onBlur={onBlur}
            onFocus={handleFocus}
            onKeyDown={onKeyDown}
            id={ElementIds.ItemLinkAutocompleteInput}
            autoComplete="off"
          />
          {areSearchResultsVisible && (
            <DisclosurePanel
              className={classNames(
                tags.length > 0 ? 'w-80' : 'mr-10 w-70',
                'absolute z-dropdown-menu flex flex-col overflow-y-auto rounded bg-default py-2 shadow-main',
              )}
              style={{
                maxHeight: dropdownMaxHeight,
              }}
              onBlur={closeOnBlur}
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            >
              <Menu
                isOpen={areSearchResultsVisible}
                a11yLabel="Unlinked items search results"
                onKeyDown={handleMenuKeyDown}
                ref={searchResultsMenuRef}
                shouldAutoFocus={false}
              >
                <LinkedItemSearchResults
                  createAndAddNewTag={createAndAddNewTag}
                  getLinkedItemIcon={getLinkedItemIcon}
                  getTitleForLinkedTag={getTitleForLinkedTag}
                  linkItemToSelectedItem={linkItemToSelectedItem}
                  results={unlinkedResults}
                  searchQuery={searchQuery}
                  shouldShowCreateTag={shouldShowCreateTag}
                  onClickCallback={() => setSearchQuery('')}
                  isEntitledToNoteLinking={isEntitledToNoteLinking}
                />
              </Menu>
            </DisclosurePanel>
          )}
        </Disclosure>
      </form>
    </div>
  )
}

export default observer(ItemLinkAutocompleteInput)
