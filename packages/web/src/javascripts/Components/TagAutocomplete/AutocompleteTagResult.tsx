import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { splitQueryInString } from '@/Utils/StringUtils'
import { SNTag } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import { FocusEventHandler, KeyboardEventHandler, useEffect, useRef } from 'react'
import Icon from '@/Components/Icon/Icon'

type Props = {
  viewControllerManager: ViewControllerManager
  tagResult: SNTag
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

const AutocompleteTagResult = ({ viewControllerManager, tagResult, closeOnBlur }: Props) => {
  const { autocompleteSearchQuery, autocompleteTagHintVisible, autocompleteTagResults, focusedTagResultUuid } =
    viewControllerManager.noteTagsController

  const tagResultRef = useRef<HTMLButtonElement>(null)

  const title = tagResult.title
  const prefixTitle = viewControllerManager.noteTagsController.getPrefixTitle(tagResult)

  const onTagOptionClick = async (tag: SNTag) => {
    await viewControllerManager.noteTagsController.addTagToActiveNote(tag)
    viewControllerManager.noteTagsController.clearAutocompleteSearch()
    viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
  }

  const onKeyDown: KeyboardEventHandler = (event) => {
    const tagResultIndex = viewControllerManager.noteTagsController.getTagIndex(tagResult, autocompleteTagResults)
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (tagResultIndex === 0) {
          viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
        } else {
          viewControllerManager.noteTagsController.focusPreviousTagResult(tagResult)
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (tagResultIndex === autocompleteTagResults.length - 1 && autocompleteTagHintVisible) {
          viewControllerManager.noteTagsController.setAutocompleteTagHintFocused(true)
        } else {
          viewControllerManager.noteTagsController.focusNextTagResult(tagResult)
        }
        break
      default:
        return
    }
  }

  const onFocus = () => {
    viewControllerManager.noteTagsController.setFocusedTagResultUuid(tagResult.uuid)
  }

  const onBlur: FocusEventHandler = (event) => {
    closeOnBlur(event)
    viewControllerManager.noteTagsController.setFocusedTagResultUuid(undefined)
  }

  useEffect(() => {
    if (focusedTagResultUuid === tagResult.uuid) {
      tagResultRef.current?.focus()
      viewControllerManager.noteTagsController.setFocusedTagResultUuid(undefined)
    }
  }, [viewControllerManager, focusedTagResultUuid, tagResult])

  return (
    <button
      ref={tagResultRef}
      type="button"
      className="sn-dropdown-item focus:bg-info focus:text-info-contrast"
      onClick={() => onTagOptionClick(tagResult)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <Icon type="hashtag" className="text-neutral mr-2 min-h-5 min-w-5" />
      <span className="whitespace-nowrap overflow-hidden overflow-ellipsis">
        {prefixTitle && <span className="text-passive-2">{prefixTitle}</span>}
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
