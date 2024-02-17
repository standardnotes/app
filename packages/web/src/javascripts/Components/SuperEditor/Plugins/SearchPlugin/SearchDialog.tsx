import Button from '@/Components/Button/Button'
import { useCommandService } from '@/Components/CommandProvider'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import { TranslateFromTopAnimation, TranslateToTopAnimation } from '@/Constants/AnimationConfigs'
import { useLifecycleAnimation } from '@/Hooks/useLifecycleAnimation'
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, ArrowRightIcon } from '@standardnotes/icons'
import {
  KeyboardKey,
  keyboardStringForShortcut,
  SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
  SUPER_SEARCH_TOGGLE_REPLACE_MODE,
  SUPER_TOGGLE_SEARCH,
} from '@standardnotes/ui-services'
import { classNames } from '@standardnotes/utils'
import { useCallback, useMemo, useState } from 'react'
import { useSuperSearchContext } from './Context'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export const SearchDialog = ({ open, closeDialog }: { open: boolean; closeDialog: () => void }) => {
  const [editor] = useLexicalComposerContext()

  const { query, results, currentResultIndex, isCaseSensitive, isReplaceMode, dispatch, dispatchReplaceEvent } =
    useSuperSearchContext()

  const [replaceQuery, setReplaceQuery] = useState('')

  const focusOnMount = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus()
    }
  }, [])

  const [isMounted, setElement] = useLifecycleAnimation({
    open,
    enter: TranslateFromTopAnimation,
    exit: TranslateToTopAnimation,
  })

  const commandService = useCommandService()
  const searchToggleShortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(SUPER_TOGGLE_SEARCH)),
    [commandService],
  )
  const toggleReplaceShortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(SUPER_SEARCH_TOGGLE_REPLACE_MODE)),
    [commandService],
  )
  const caseSensitivityShortcut = useMemo(
    () => keyboardStringForShortcut(commandService.keyboardShortcutForCommand(SUPER_SEARCH_TOGGLE_CASE_SENSITIVE)),
    [commandService],
  )

  if (!isMounted) {
    return null
  }

  return (
    <div
      className={classNames(
        'absolute left-2 right-6 top-2 z-10 flex select-none rounded border border-border bg-default md:left-auto',
        editor.isEditable() ? 'md:top-13' : 'md:top-3',
      )}
      ref={setElement}
    >
      {editor.isEditable() && (
        <button
          className="focus:ring-none border-r border-border px-1 hover:bg-contrast focus:shadow-inner focus:shadow-info"
          onClick={() => {
            dispatch({ type: 'toggle-replace-mode' })
          }}
          title={`Toggle Replace Mode (${toggleReplaceShortcut})`}
        >
          {isReplaceMode ? (
            <ArrowDownIcon className="h-4 w-4 fill-text" />
          ) : (
            <ArrowRightIcon className="h-4 w-4 fill-text" />
          )}
        </button>
      )}
      <div
        className="flex flex-col gap-2 px-2 py-2"
        onKeyDown={(event) => {
          if (event.key === KeyboardKey.Escape) {
            closeDialog()
          }
        }}
      >
        <div className="flex items-center gap-2">
          <DecoratedInput
            placeholder="Search"
            className={{
              container: classNames('flex-grow !text-[length:inherit]', !query.length && '!py-1'),
              right: '!py-1',
            }}
            value={query}
            onChange={(query) => {
              dispatch({
                type: 'set-query',
                query,
              })
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && results.length) {
                if (event.shiftKey) {
                  dispatch({
                    type: 'go-to-previous-result',
                  })
                  return
                }
                dispatch({
                  type: 'go-to-next-result',
                })
              }
            }}
            ref={focusOnMount}
            right={[
              <div className="min-w-[7ch] max-w-[7ch] flex-shrink-0 whitespace-nowrap text-right">
                {query.length > 0 && (
                  <>
                    {currentResultIndex > -1 ? currentResultIndex + 1 + ' / ' : null}
                    {results.length}
                  </>
                )}
              </div>,
            ]}
          />
          <label
            className={classNames(
              'relative flex items-center rounded border px-1.5 py-1 focus-within:ring-2 focus-within:ring-info focus-within:ring-offset-2 focus-within:ring-offset-default',
              isCaseSensitive ? 'border-info bg-info text-info-contrast' : 'border-border hover:bg-contrast',
            )}
            title={`Case sensitive (${caseSensitivityShortcut})`}
          >
            <input
              type="checkbox"
              className="absolute left-0 top-0 z-[1] m-0 h-full w-full cursor-pointer border border-transparent p-0 opacity-0 shadow-none outline-none"
              checked={isCaseSensitive}
              onChange={() => {
                dispatch({
                  type: 'toggle-case-sensitive',
                })
              }}
            />
            <span aria-hidden>Aa</span>
            <span className="sr-only">Case sensitive</span>
          </label>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
            onClick={() => {
              dispatch({
                type: 'go-to-previous-result',
              })
            }}
            disabled={results.length < 1}
            title="Previous result (Shift + Enter)"
          >
            <ArrowUpIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
            onClick={() => {
              dispatch({
                type: 'go-to-next-result',
              })
            }}
            disabled={results.length < 1}
            title="Next result (Enter)"
          >
            <ArrowDownIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
            onClick={() => {
              closeDialog()
            }}
            title={`Close (${searchToggleShortcut})`}
          >
            <CloseIcon className="h-4 w-4 fill-current text-text" />
          </button>
        </div>
        {isReplaceMode && (
          <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <input
              type="text"
              placeholder="Replace"
              onChange={(e) => {
                setReplaceQuery(e.target.value)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && replaceQuery && results.length) {
                  if (event.ctrlKey && event.altKey) {
                    dispatchReplaceEvent({
                      type: 'all',
                      replace: replaceQuery,
                    })
                    event.preventDefault()
                    return
                  }
                  dispatchReplaceEvent({
                    type: 'next',
                    replace: replaceQuery,
                  })
                  event.preventDefault()
                }
              }}
              className="rounded border border-border bg-default p-1 px-2"
              ref={focusOnMount}
            />
            <Button
              small
              onClick={() => {
                dispatchReplaceEvent({
                  type: 'next',
                  replace: replaceQuery,
                })
              }}
              disabled={results.length < 1 || replaceQuery.length < 1}
              title="Replace (Ctrl + Enter)"
            >
              Replace
            </Button>
            <Button
              small
              onClick={() => {
                dispatchReplaceEvent({
                  type: 'all',
                  replace: replaceQuery,
                })
              }}
              disabled={results.length < 1 || replaceQuery.length < 1}
              title="Replace all (Ctrl + Alt + Enter)"
            >
              Replace all
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
