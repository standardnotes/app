import { NoteTagsController } from '@/Controllers/NoteTagsController'
import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback, FocusEventHandler, KeyboardEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

type Props = {
  noteTagsController: NoteTagsController
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

const AutocompleteTagHint = ({ noteTagsController, closeOnBlur }: Props) => {
  const { autocompleteTagHintFocused } = noteTagsController

  const hintRef = useRef<HTMLButtonElement>(null)

  const { autocompleteSearchQuery, autocompleteTagResults } = noteTagsController

  const onTagHintClick = useCallback(async () => {
    await noteTagsController.createAndAddNewTag()
    noteTagsController.setAutocompleteInputFocused(true)
  }, [noteTagsController])

  const onFocus = useCallback(() => {
    noteTagsController.setAutocompleteTagHintFocused(true)
  }, [noteTagsController])

  const onBlur: FocusEventHandler = useCallback(
    (event) => {
      closeOnBlur(event)
      noteTagsController.setAutocompleteTagHintFocused(false)
    },
    [noteTagsController, closeOnBlur],
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      if (event.key === 'ArrowUp') {
        if (autocompleteTagResults.length > 0) {
          const lastTagResult = autocompleteTagResults[autocompleteTagResults.length - 1]
          noteTagsController.setFocusedTagResultUuid(lastTagResult.uuid)
        } else {
          noteTagsController.setAutocompleteInputFocused(true)
        }
      }
    },
    [noteTagsController, autocompleteTagResults],
  )

  useEffect(() => {
    if (autocompleteTagHintFocused) {
      hintRef.current?.focus()
    }
  }, [noteTagsController, autocompleteTagHintFocused])

  return (
    <>
      {autocompleteTagResults.length > 0 && <HorizontalSeparator classes="my-2" />}
      <button
        ref={hintRef}
        type="button"
        className="flex w-full cursor-pointer items-center border-0 bg-transparent px-3 py-1.5 text-left text-sm text-text hover:bg-contrast hover:text-foreground focus:bg-info focus:text-info-contrast focus:shadow-none"
        onClick={onTagHintClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <span>Create new tag:</span>
        <span className="ml-2 flex items-center rounded bg-contrast py-1 pl-1 pr-2 text-xs text-text">
          <Icon type="hashtag" className="mr-1 text-neutral" size="small" />
          <span className="max-w-40 overflow-hidden overflow-ellipsis whitespace-nowrap">
            {autocompleteSearchQuery}
          </span>
        </span>
      </button>
    </>
  )
}

export default observer(AutocompleteTagHint)
