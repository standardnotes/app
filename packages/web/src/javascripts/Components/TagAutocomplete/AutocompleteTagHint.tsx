import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback, FocusEventHandler, KeyboardEventHandler } from 'react'
import Icon from '@/Components/Icon/Icon'

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
      {autocompleteTagResults.length > 0 && <div className="h-1px my-2 bg-border"></div>}
      <button
        ref={hintRef}
        type="button"
        className="sn-dropdown-item focus:bg-info focus:color-info-contrast hover:color-foreground"
        onClick={onTagHintClick}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <span>Create new tag:</span>
        <span className="bg-contrast rounded text-xs color-text py-1 pl-1 pr-2 flex items-center ml-2">
          <Icon type="hashtag" className="color-neutral mr-1" size="small" />
          <span className="max-w-40 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {autocompleteSearchQuery}
          </span>
        </span>
      </button>
    </>
  )
}

export default observer(AutocompleteTagHint)
