import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from '@standardnotes/icons'
import { classNames } from '@standardnotes/snjs'
import { useEffect, useRef } from 'react'
import { useSuperSearchContext } from './Context'

export const SearchDialog = ({ closeDialog }: { closeDialog: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const { query, results, currentResultIndex, isCaseSensitive, dispatch } = useSuperSearchContext()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="border-border bg-default absolute right-6 top-4 flex items-center gap-2 rounded border py-2 px-2"
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
          if (event.key === 'Enter') {
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
        className="border-border rounded border p-1 px-2"
        ref={inputRef}
      />
      {results.length > 0 && (
        <span className="text-text">
          {currentResultIndex > -1 ? currentResultIndex + 1 + ' of ' : null}
          {results.length} results
        </span>
      )}
      <label
        className={classNames(
          'border-border focus-within:ring-info relative flex items-center rounded border py-1 px-1.5 focus-within:ring-2 focus-within:ring-offset-2',
          isCaseSensitive ? 'bg-info text-info-contrast' : 'hover:bg-contrast',
        )}
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
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={() => {
          dispatch({
            type: 'go-to-previous-result',
          })
        }}
      >
        <ArrowUpIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={() => {
          dispatch({
            type: 'go-to-next-result',
          })
        }}
      >
        <ArrowDownIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={() => {
          closeDialog()
        }}
      >
        <CloseIcon className="text-text h-4 w-4 fill-current" />
      </button>
    </div>
  )
}
