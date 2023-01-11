import {
  ArrowDownIcon,
  ArrowUpIcon,
  CloseIcon,
  ReplaceIcon,
  ReplaceAllIcon,
  ArrowRightIcon,
} from '@standardnotes/icons'
import { classNames, EnterFromTopAnimation, ExitToTopAnimation, useLifecycleAnimation } from '@standardnotes/utils'
import { useCallback, useState } from 'react'
import { useSuperSearchContext } from './Context'

export const SearchDialog = ({ open, closeDialog }: { open: boolean; closeDialog: () => void }) => {
  const { query, results, currentResultIndex, isCaseSensitive, dispatch, dispatchReplaceEvent } =
    useSuperSearchContext()

  const [isReplaceMode, setIsReplaceMode] = useState(false)
  const [replaceQuery, setReplaceQuery] = useState('')

  const focusOnMount = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus()
    }
  }, [])

  const [isMounted, setElement] = useLifecycleAnimation({
    open,
    enter: EnterFromTopAnimation,
    exit: ExitToTopAnimation,
  })

  if (!isMounted) {
    return null
  }

  return (
    <div className="absolute right-6 top-4 flex select-none rounded border border-border bg-default" ref={setElement}>
      <button
        className="focus:ring-none border-r border-border px-1 hover:bg-contrast focus:shadow-inner focus:shadow-info"
        onClick={() => {
          setIsReplaceMode((isReplaceMode) => !isReplaceMode)
        }}
        title="Toggle Replace Mode"
      >
        {isReplaceMode ? (
          <ArrowDownIcon className="h-4 w-4 fill-text" />
        ) : (
          <ArrowRightIcon className="h-4 w-4 fill-text" />
        )}
      </button>
      <div
        className="flex flex-col gap-2 py-2 px-2"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeDialog()
          }
          if (event.ctrlKey && event.key === 'f') {
            event.preventDefault()
            closeDialog()
          }
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => {
              dispatch({
                type: 'set-query',
                query: e.target.value,
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
              if (event.altKey && event.key === 'c') {
                dispatch({
                  type: 'set-case-sensitive',
                  isCaseSensitive: !isCaseSensitive,
                })
              }
            }}
            className="rounded border border-border bg-default p-1 px-2"
            ref={focusOnMount}
          />
          {results.length > 0 ? (
            <span className="min-w-[10ch] text-text">
              {currentResultIndex > -1 ? currentResultIndex + 1 + ' of ' : null}
              {results.length}
            </span>
          ) : (
            <span className="min-w-[10ch] text-text">No results</span>
          )}
          <label
            className={classNames(
              'relative flex items-center rounded border py-1 px-1.5 focus-within:ring-2 focus-within:ring-info focus-within:ring-offset-2 focus-within:ring-offset-default',
              isCaseSensitive ? 'border-info bg-info text-info-contrast' : 'border-border hover:bg-contrast',
            )}
            title="Case sensitive (Alt + C)"
          >
            <input
              type="checkbox"
              className="absolute top-0 left-0 z-[1] m-0 h-full w-full cursor-pointer border border-transparent p-0 opacity-0 shadow-none outline-none"
              checked={isCaseSensitive}
              onChange={(e) => {
                dispatch({
                  type: 'set-case-sensitive',
                  isCaseSensitive: e.target.checked,
                })
              }}
            />
            <span aria-hidden>Aa</span>
            <span className="sr-only">Case sensitive</span>
          </label>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
            onClick={() => {
              dispatch({
                type: 'go-to-previous-result',
              })
            }}
            title="Previous result (Shift + Enter)"
          >
            <ArrowUpIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
            onClick={() => {
              dispatch({
                type: 'go-to-next-result',
              })
            }}
            title="Next result (Enter)"
          >
            <ArrowDownIcon className="h-4 w-4 fill-current text-text" />
          </button>
          <button
            className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
            onClick={() => {
              closeDialog()
            }}
            title="Close (Esc)"
          >
            <CloseIcon className="h-4 w-4 fill-current text-text" />
          </button>
        </div>
        {isReplaceMode && (
          <div className="flex items-center gap-2">
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
            <button
              className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
              onClick={() => {
                dispatchReplaceEvent({
                  type: 'next',
                  replace: replaceQuery,
                })
              }}
              title="Replace (Ctrl + Enter)"
            >
              <ReplaceIcon className="h-4 w-4 fill-current text-text" />
            </button>
            <button
              className="flex items-center rounded border border-border p-1.5 hover:bg-contrast"
              onClick={() => {
                dispatchReplaceEvent({
                  type: 'all',
                  replace: replaceQuery,
                })
              }}
              title="Replace all (Ctrl + Alt + Enter)"
            >
              <ReplaceAllIcon className="h-4 w-4 fill-current text-text" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
