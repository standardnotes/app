import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { SearchIcon } from '@standardnotes/icons'
import { COMMAND_PRIORITY_EDITOR, KEY_MODIFIER_COMMAND } from 'lexical'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { debounce } from '../../Utils/debounce'
import { createSearchHighlightElement } from './createSearchHighlightElement'
import { useSuperSearchContext } from './Context'
import { SearchDialog } from './SearchDialog'
import { getAllTextNodesInElement } from './getAllTextNodesInElement'
import { SuperSearchResult } from './Types'

export const SearchPlugin = () => {
  const [editor] = useLexicalComposerContext()
  const [showDialog, setShowDialog] = useState(false)
  const { query, currentResultIndex, results, isCaseSensitive, dispatch } = useSuperSearchContext()

  useEffect(() => {
    return editor.registerCommand<KeyboardEvent>(
      KEY_MODIFIER_COMMAND,
      (event: KeyboardEvent) => {
        const isCmdF = event.key === 'f' && !event.altKey && (event.metaKey || event.ctrlKey)

        if (!isCmdF) {
          return false
        }

        event.preventDefault()
        event.stopPropagation()

        setShowDialog((show) => !show)

        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  const handleSearch = useCallback(
    (query: string, isCaseSensitive: boolean) => {
      document.querySelectorAll('.search-highlight').forEach((element) => {
        element.remove()
      })

      if (!query) {
        dispatch({ type: 'clear-results' })
        return
      }

      editor.getEditorState().read(() => {
        const rootElement = editor.getRootElement()

        if (!rootElement) {
          return
        }

        const textNodes = getAllTextNodesInElement(rootElement)

        const results: SuperSearchResult[] = []

        textNodes.forEach((node) => {
          const text = node.textContent || ''

          const indices: number[] = []
          let index = -1

          const textWithCase = isCaseSensitive ? text : text.toLowerCase()
          const queryWithCase = isCaseSensitive ? query : query.toLowerCase()

          while ((index = textWithCase.indexOf(queryWithCase, index + 1)) !== -1) {
            indices.push(index)
          }

          indices.forEach((index) => {
            const startIndex = index
            const endIndex = startIndex + query.length

            results.push({
              node,
              startIndex,
              endIndex,
            })
          })
        })

        dispatch({
          type: 'set-results',
          results,
        })
      })
    },
    [dispatch, editor],
  )

  const debouncedHandleSearch = useMemo(() => debounce(handleSearch, 250), [handleSearch])

  useEffect(() => {
    void debouncedHandleSearch(query, isCaseSensitive)
  }, [debouncedHandleSearch, isCaseSensitive, query])

  useEffect(() => {
    if (currentResultIndex === -1) {
      return
    }
    const result = results[currentResultIndex]
    editor.getEditorState().read(() => {
      const rootElement = editor.getRootElement()
      const containerElement = rootElement?.parentElement?.getElementsByClassName('search-highlight-container')[0]
      document.querySelectorAll('.search-highlight').forEach((element) => {
        element.remove()
      })
      result.node.parentElement?.scrollIntoView({
        block: 'center',
      })
      if (!rootElement || !containerElement) {
        return
      }
      createSearchHighlightElement(result, rootElement, containerElement)
    })
  }, [currentResultIndex, editor, results])

  return (
    <>
      {showDialog && (
        <SearchDialog
          closeDialog={() => {
            setShowDialog(false)
            dispatch({ type: 'reset-search' })
          }}
        />
      )}
      {/** @TODO Replace with better mobile UX */}
      <div className="absolute top-4 left-[1rem] md:hidden">
        <button className="border-border bg-default rounded-full border p-1" onClick={() => setShowDialog(true)}>
          <SearchIcon className="text-text h-4 w-4 fill-current" />
        </button>
      </div>
    </>
  )
}
