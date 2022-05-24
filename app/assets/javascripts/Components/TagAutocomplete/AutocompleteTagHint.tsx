import { AppState } from '@/UIModels/AppState'
import { observer } from 'mobx-react-lite'
import { useRef, useEffect, useCallback, FocusEventHandler, KeyboardEventHandler } from 'react'
import { Icon } from '@/Components/Icon/Icon'

type Props = {
  appState: AppState
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}

export const AutocompleteTagHint = observer(({ appState, closeOnBlur }: Props) => {
  const { autocompleteTagHintFocused } = appState.noteTags

  const hintRef = useRef<HTMLButtonElement>(null)

  const { autocompleteSearchQuery, autocompleteTagResults } = appState.noteTags

  const onTagHintClick = useCallback(async () => {
    await appState.noteTags.createAndAddNewTag()
    appState.noteTags.setAutocompleteInputFocused(true)
  }, [appState])

  const onFocus = useCallback(() => {
    appState.noteTags.setAutocompleteTagHintFocused(true)
  }, [appState])

  const onBlur: FocusEventHandler = useCallback(
    (event) => {
      closeOnBlur(event)
      appState.noteTags.setAutocompleteTagHintFocused(false)
    },
    [appState, closeOnBlur],
  )

  const onKeyDown: KeyboardEventHandler = useCallback(
    (event) => {
      if (event.key === 'ArrowUp') {
        if (autocompleteTagResults.length > 0) {
          const lastTagResult = autocompleteTagResults[autocompleteTagResults.length - 1]
          appState.noteTags.setFocusedTagResultUuid(lastTagResult.uuid)
        } else {
          appState.noteTags.setAutocompleteInputFocused(true)
        }
      }
    },
    [appState, autocompleteTagResults],
  )

  useEffect(() => {
    if (autocompleteTagHintFocused) {
      hintRef.current?.focus()
    }
  }, [appState, autocompleteTagHintFocused])

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
          <Icon type="hashtag" className="sn-icon--small color-neutral mr-1" />
          <span className="max-w-40 whitespace-nowrap overflow-hidden overflow-ellipsis">
            {autocompleteSearchQuery}
          </span>
        </span>
      </button>
    </>
  )
})
