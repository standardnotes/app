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
import AutocompleteTagResult from './AutocompleteTagResult'
import AutocompleteTagHint from './AutocompleteTagHint'
import { observer } from 'mobx-react-lite'
import { SNTag } from '@standardnotes/snjs'
import { classNames } from '@/Utils/ConcatenateClassNames'
import { FOCUSABLE_BUT_NOT_TABBABLE } from '@/Constants/Constants'
import { NoteTagsController } from '@/Controllers/NoteTagsController'

type Props = {
  noteTagsController: NoteTagsController
}

const AutocompleteTagInput = ({ noteTagsController }: Props) => {
  const {
    autocompleteInputFocused,
    autocompleteSearchQuery,
    autocompleteTagHintVisible,
    autocompleteTagResults,
    tags,
    tagsContainerMaxWidth,
  } = noteTagsController

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | 'auto'>('auto')

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [closeOnBlur] = useCloseOnBlur(containerRef, (visible: boolean) => {
    setDropdownVisible(visible)
    noteTagsController.clearAutocompleteSearch()
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
      noteTagsController.clearAutocompleteSearch()
    } else {
      noteTagsController.setAutocompleteSearchQuery(query)
      noteTagsController.searchActiveNoteAutocompleteTags()
    }
  }

  const onFormSubmit: FormEventHandler = async (event) => {
    event.preventDefault()
    if (autocompleteSearchQuery !== '') {
      await noteTagsController.createAndAddNewTag()
    }
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    switch (event.key) {
      case 'Backspace':
      case 'ArrowLeft':
        if (autocompleteSearchQuery === '' && tags.length > 0) {
          noteTagsController.setFocusedTagUuid(tags[tags.length - 1].uuid)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (autocompleteTagResults.length > 0) {
          noteTagsController.setFocusedTagResultUuid(autocompleteTagResults[0].uuid)
        } else if (autocompleteTagHintVisible) {
          noteTagsController.setAutocompleteTagHintFocused(true)
        }
        break
      default:
        return
    }
  }

  const onFocus = () => {
    showDropdown()
    noteTagsController.setAutocompleteInputFocused(true)
  }

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
    noteTagsController.setAutocompleteInputFocused(false)
  }

  useEffect(() => {
    if (autocompleteInputFocused) {
      inputRef.current?.focus()
    }
  }, [autocompleteInputFocused])

  return (
    <div ref={containerRef}>
      <form onSubmit={onFormSubmit} className={`${tags.length > 0 ? 'mt-2' : ''}`}>
        <Disclosure open={dropdownVisible} onChange={showDropdown}>
          <input
            ref={inputRef}
            className={`${tags.length > 0 ? 'w-80' : 'mr-10 w-70'} no-border h-7
            bg-transparent text-xs text-text focus:border-b-2 focus:border-solid focus:border-info focus:shadow-none focus:outline-none`}
            value={autocompleteSearchQuery}
            onChange={onSearchQueryChange}
            type="text"
            placeholder="Add tags, notes, files..."
            onBlur={onBlur}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            tabIndex={tags.length === 0 ? 0 : -1}
          />
          {dropdownVisible && (autocompleteTagResults.length > 0 || autocompleteTagHintVisible) && (
            <DisclosurePanel
              className={classNames(
                tags.length > 0 ? 'w-80' : 'mr-10 w-70',
                'absolute z-dropdown-menu flex flex-col rounded bg-default py-2 shadow-main',
              )}
              style={{
                maxHeight: dropdownMaxHeight,
                maxWidth: tagsContainerMaxWidth,
              }}
              onBlur={closeOnBlur}
              tabIndex={FOCUSABLE_BUT_NOT_TABBABLE}
            >
              <div className="md:overflow-y-auto">
                {autocompleteTagResults.map((tagResult: SNTag) => (
                  <AutocompleteTagResult
                    key={tagResult.uuid}
                    noteTagsController={noteTagsController}
                    tagResult={tagResult}
                    closeOnBlur={closeOnBlur}
                  />
                ))}
              </div>
              {autocompleteTagHintVisible && (
                <AutocompleteTagHint noteTagsController={noteTagsController} closeOnBlur={closeOnBlur} />
              )}
            </DisclosurePanel>
          )}
        </Disclosure>
      </form>
    </div>
  )
}

export default observer(AutocompleteTagInput)
