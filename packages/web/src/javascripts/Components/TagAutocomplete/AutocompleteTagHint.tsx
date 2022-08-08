import { ViewControllerManager } from '@/Controllers/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback, FocusEventHandler, KeyboardEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'
import HorizontalSeparator from '../Shared/HorizontalSeparator'

type Props = {
  viewControllerManager: ViewControllerManager
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

const AutocompleteTagHint = ({ viewControllerManager, closeOnBlur }: Props) => {
  const { autocompleteTagHintFocused } = viewControllerManager.noteTagsController

  const hintRef = useRef<HTMLButtonElement>(null)

  const { autocompleteSearchQuery, autocompleteTagResults } = viewControllerManager.noteTagsController

  const onTagHintClick = useCallback(async () => {
    await viewControllerManager.noteTagsController.createAndAddNewTag()
    viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
  }, [viewControllerManager])

  const onFocus = useCallback(() => {
    viewControllerManager.noteTagsController.setAutocompleteTagHintFocused(true)
  }, [viewControllerManager])

  const onBlur: FocusEventHandler = useCallback(
    (event) => {
      closeOnBlur(event)
      viewControllerManager.noteTagsController.setAutocompleteTagHintFocused(false)
    },
    [viewControllerManager, closeOnBlur],
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      if (event.key === 'ArrowUp') {
        if (autocompleteTagResults.length > 0) {
          const lastTagResult = autocompleteTagResults[autocompleteTagResults.length - 1]
          viewControllerManager.noteTagsController.setFocusedTagResultUuid(lastTagResult.uuid)
        } else {
          viewControllerManager.noteTagsController.setAutocompleteInputFocused(true)
        }
      }
    },
    [viewControllerManager, autocompleteTagResults],
  )

  useEffect(() => {
    if (autocompleteTagHintFocused) {
      hintRef.current?.focus()
    }
  }, [viewControllerManager, autocompleteTagHintFocused])

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
