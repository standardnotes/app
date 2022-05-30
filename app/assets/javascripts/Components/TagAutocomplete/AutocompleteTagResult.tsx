import { AppState } from '@/UIModels/AppState'
import { splitQueryInString } from '@/Utils/StringUtils'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FocusEventHandler, KeyboardEventHandler, useEffect, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'

type Props = {
  appState: AppState
  tagResult: SNTag
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

const AutocompleteTagResult = ({ appState, tagResult, closeOnBlur }: Props) => {
  const { autocompleteSearchQuery, autocompleteTagHintVisible, autocompleteTagResults, focusedTagResultUuid } =
    appState.noteTags

  const tagResultRef = useRef<HTMLButtonElement>(null)

  const title = tagResult.title
  const prefixTitle = appState.noteTags.getPrefixTitle(tagResult)

  const onTagOptionClick = async (tag: SNTag) => {
    await appState.noteTags.addTagToActiveNote(tag)
    appState.noteTags.clearAutocompleteSearch()
    appState.noteTags.setAutocompleteInputFocused(true)
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    const tagResultIndex = appState.noteTags.getTagIndex(tagResult, autocompleteTagResults)
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (tagResultIndex === 0) {
          appState.noteTags.setAutocompleteInputFocused(true)
        } else {
          appState.noteTags.focusPreviousTagResult(tagResult)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (tagResultIndex === autocompleteTagResults.length - 1 && autocompleteTagHintVisible) {
          appState.noteTags.setAutocompleteTagHintFocused(true)
        } else {
          appState.noteTags.focusNextTagResult(tagResult)
        }
        break
      default:
        return
    }
  }

  const onFocus = () => {
    appState.noteTags.setFocusedTagResultUuid(tagResult.uuid)
  }

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
    appState.noteTags.setFocusedTagResultUuid(undefined)
  }

  useEffect(() => {
    if (focusedTagResultUuid === tagResult.uuid) {
      tagResultRef.current?.focus()
      appState.noteTags.setFocusedTagResultUuid(undefined)
    }
  }, [appState, focusedTagResultUuid, tagResult])

  return (
    <button
      ref={tagResultRef}
      type="button"
      className="sn-dropdown-item focus:bg-info focus:color-info-contrast"
      onClick={() => onTagOptionClick(tagResult)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <Icon type="hashtag" className="color-neutral mr-2 min-h-5 min-w-5" />
      <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        {prefixTitle && <span className="color-passive-2">{prefixTitle}</span>}
        {autocompleteSearchQuery === ''
          ? title
          : splitQueryInString(title, autocompleteSearchQuery).map((substring, index) => (
              <span
                key={index}
                className={`${
                  substring.toLowerCase() === autocompleteSearchQuery.toLowerCase()
                    ? 'font-bold whitespace-pre-wrap'
                    : 'whitespace-pre-wrap '
                }`}
              >
                {substring}
              </span>
            ))}
      </span>
    </button>
  )
}

export default observer(AutocompleteTagResult)
