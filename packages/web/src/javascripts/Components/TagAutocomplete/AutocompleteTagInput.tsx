import {
  ChangeEventHandler,
  FocusEventHandler,
  FormEventHandler,
  KeyboardEventHandler,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Disclosure, DisclosurePanel } from '@reach/disclosure'
import { useCloseOnBlur } from '@/Hooks/useCloseOnBlur'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import AutocompleteTagResult from './AutocompleteTagResult'
import AutocompleteTagHint from './AutocompleteTagHint'
import { observer } from 'mobx-react-lite'
import { SNTag } from '@standardnotes/snjs'

type Props = {
  viewControllerManager: ViewControllerManager
}

const AutocompleteTagInput = ({ viewControllerManager }: Props) => {
  const {
    autocompleteInputFocused,
    autocompleteSearchQuery,
    autocompleteTagHintVisible,
    autocompleteTagResults,
    tags,
    tagsContainerMaxWidth,
  } = viewControllerManager.noteTagsController

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | 'auto'>('auto')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [closeOnBlur] = useCloseOnBlur(containerRef, (visible: boolean) => {
    setDropdownVisible(visible)
    viewControllerManager.noteTagsController.clearAutocompleteSearch()
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
    const query = event.target.value

    if (query === '') {
      viewControllerManager.noteTagsController.clearAutocompleteSearch()
    } else {
      viewControllerManager.noteTagsController.setAutocompleteSearchQuery(query)
      viewControllerManager.noteTagsController.searchActiveNoteAutocompleteTags()
    }
  }

  const onFormSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (autocompleteSearchQuery !== '') {
      await viewControllerManager.noteTagsController.createAndAddNewTag()
    }
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case 'Backspace':
      case 'ArrowLeft':
        if (autocompleteSearchQuery === '' && tags.length > 0) {
          viewControllerManager.noteTagsController.setFocusedTagUuid(tags[tags.length - 1].uuid)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (autocompleteTagResults.length > 0) {
          viewControllerManager.noteTagsController.setFocusedTagResultUuid(autocompleteTagResults[0].uuid)
        } else if (autocompleteTagHintVisible) {
          viewControllerManager.noteTagsController.setAutocompleteTagHintFocused(true)
        }
        break
      default:
        return
    }
  }

  const onFocus = () => {
    showDropdown()
    viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
  }

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
    viewControllerManager.noteTagsController.setAutocompleteInputFocused(false)
  }

  useEffect(() => {
    if (autocompleteInputFocused) {
      inputRef.current?.focus()
    }
  }, [viewControllerManager, autocompleteInputFocused])

  return (
    <div ref={containerRef}>
      <form onSubmit={onFormSubmit} className={`${tags.length > 0 ? 'mt-2' : ''}`}>
        <Disclosure open={dropdownVisible} onChange={showDropdown}>
          <input
            ref={inputRef}
            className={`${tags.length > 0 ? 'w-80' : 'w-70 mr-10'} bg-transparent text-xs
            text-text no-border h-7 focus:outline-none focus:shadow-none focus:border-b-2 focus:border-solid focus:border-info`}
            value={autocompleteSearchQuery}
            onChange={onSearchQueryChange}
            type="text"
            placeholder="Add tag"
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            tabIndex={tags.length === 0 ? 0 : -1}
          />
          {dropdownVisible && (autocompleteTagResults.length > 0 || autocompleteTagHintVisible) && (
            <DisclosurePanel
              className={`${
                tags.length > 0 ? 'w-80' : 'w-70 mr-10'
              } bg-default rounded shadow-main flex flex-col py-2 absolute`}
              style={{
                maxHeight: dropdownMaxHeight,
                maxWidth: tagsContainerMaxWidth,
              }}
              onBlur={closeOnBlur}
            >
              <div className="overflow-y-auto">
                {autocompleteTagResults.map((tagResult: SNTag) => (
                  <AutocompleteTagResult
                    key={tagResult.uuid}
                    viewControllerManager={viewControllerManager}
                    tagResult={tagResult}
                    closeOnBlur={closeOnBlur}
                  />
                ))}
              </div>
              {autocompleteTagHintVisible && (
                <AutocompleteTagHint viewControllerManager={viewControllerManager} closeOnBlur={closeOnBlur} />
              )}
            </DisclosurePanel>
          )}
        </Disclosure>
      </form>
    </div>
  )
}

export default observer(AutocompleteTagInput)
