import { ArrowDownIcon, ArrowUpIcon, CloseIcon } from '@standardnotes/icons'
import { useEffect, useRef } from 'react'
import { useSuperSearchContext } from './Context'

export const SearchDialog = ({ closeDialog }: { closeDialog: () => void }) => {
  const inputRef = useRef<HTMLInputElement>(null)

  const { searchQuery, setSearchQuery, results, goToNextResult, goToPreviousResult, currentResultIndex } =
    useSuperSearchContext()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div
      className="bg-default border-border absolute right-6 top-4 flex items-center gap-2 rounded border py-2 px-2"
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
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="border-border rounded border p-1 px-2"
        ref={inputRef}
      />
      {results.length > 0 && (
        <span className="text-text">
          {currentResultIndex > -1 ? currentResultIndex + 1 + ' of ' : null}
          {results.length} results
        </span>
      )}
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={goToPreviousResult}
      >
        <ArrowUpIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={goToNextResult}
      >
        <ArrowDownIcon className="text-text h-4 w-4 fill-current" />
      </button>
      <button
        className="border-border hover:bg-contrast flex items-center rounded border p-1.5"
        onClick={() => {
          setSearchQuery('')
          closeDialog()
        }}
      >
        <CloseIcon className="text-text h-4 w-4 fill-current" />
      </button>
    </div>
  )
}
