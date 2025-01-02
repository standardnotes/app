import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNearestNodeFromDOMNode, TextNode, $createRangeSelection, $setSelection, $isTextNode } from 'lexical'
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import { createSearchHighlightElement } from './createSearchHighlightElement'
import { useSuperSearchContext } from './Context'
import { SearchDialog } from './SearchDialog'
import { getAllTextNodesInElement } from './getAllTextNodesInElement'
import { SuperSearchResult } from './Types'
import { debounce } from '@standardnotes/utils'
import { useApplication } from '@/Components/ApplicationProvider'
import {
  SUPER_SEARCH_NEXT_RESULT,
  SUPER_SEARCH_PREVIOUS_RESULT,
  SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
  SUPER_SEARCH_TOGGLE_REPLACE_MODE,
  SUPER_TOGGLE_SEARCH,
} from '@standardnotes/ui-services'
import { useStateRef } from '@/Hooks/useStateRef'

export const SearchPlugin = () => {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const { query, currentResultIndex, results, isCaseSensitive, isSearchActive, dispatch, addReplaceEventListener } =
    useSuperSearchContext()
  const queryRef = useStateRef(query)
  const currentResultIndexRef = useStateRef(currentResultIndex)
  const isCaseSensitiveRef = useStateRef(isCaseSensitive)
  const resultsRef = useStateRef(results)

  useEffect(() => {
    return application.keyboardService.addCommandHandlers([
      {
        command: SUPER_TOGGLE_SEARCH,
        category: 'Super notes',
        description: 'Search in current note',
        onKeyDown: (event) => {
          event.preventDefault()
          event.stopPropagation()
          dispatch({ type: 'toggle-search' })
        },
      },
      {
        command: SUPER_SEARCH_TOGGLE_REPLACE_MODE,
        category: 'Super notes',
        description: 'Search and replace in current note',
        onKeyDown: (event) => {
          if (!editor.isEditable()) {
            return
          }
          event.preventDefault()
          event.stopPropagation()
          dispatch({ type: 'toggle-replace-mode' })
        },
      },
      {
        command: SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
        onKeyDown() {
          dispatch({
            type: 'toggle-case-sensitive',
          })
        },
      },
      {
        command: SUPER_SEARCH_NEXT_RESULT,
        category: 'Super notes',
        description: 'Go to next search result',
        onKeyDown(event) {
          event.preventDefault()
          event.stopPropagation()
          dispatch({
            type: 'go-to-next-result',
          })
        },
      },
      {
        command: SUPER_SEARCH_PREVIOUS_RESULT,
        category: 'Super notes',
        description: 'Go to previous search result',
        onKeyDown(event) {
          event.preventDefault()
          event.stopPropagation()
          dispatch({
            type: 'go-to-previous-result',
          })
        },
      },
    ])
  }, [application.keyboardService, dispatch, editor])

  const handleSearch = useCallback(
    (query: string, isCaseSensitive: boolean) => {
      const currentHighlights = document.querySelectorAll('.search-highlight')
      for (const element of currentHighlights) {
        element.remove()
      }

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

        for (const node of textNodes) {
          const text = node.textContent || ''

          const indices: number[] = []
          let index = -1

          const textWithCase = isCaseSensitive ? text : text.toLowerCase()
          const queryWithCase = isCaseSensitive ? query : query.toLowerCase()

          while ((index = textWithCase.indexOf(queryWithCase, index + 1)) !== -1) {
            indices.push(index)
          }

          for (const index of indices) {
            const startIndex = index
            const endIndex = startIndex + query.length

            results.push({
              node,
              startIndex,
              endIndex,
            })
          }
        }

        dispatch({
          type: 'set-results',
          results,
        })
      })
    },
    [dispatch, editor],
  )

  const handleQueryChange = useMemo(() => debounce(handleSearch, 250), [handleSearch])
  const handleEditorChange = useMemo(() => debounce(handleSearch, 500), [handleSearch])

  useEffect(() => {
    if (!query) {
      dispatch({ type: 'clear-results' })
      dispatch({ type: 'set-current-result-index', index: -1 })
      return
    }

    void handleQueryChange(query, isCaseSensitiveRef.current)
  }, [dispatch, handleQueryChange, isCaseSensitiveRef, query])

  useEffect(() => {
    const handleCaseSensitiveChange = () => {
      void handleSearch(queryRef.current, isCaseSensitive)
    }
    handleCaseSensitiveChange()
  }, [handleSearch, isCaseSensitive, queryRef])

  useLayoutEffect(() => {
    return editor.registerUpdateListener(({ dirtyElements, dirtyLeaves, prevEditorState, tags }) => {
      if (
        (dirtyElements.size === 0 && dirtyLeaves.size === 0) ||
        tags.has('history-merge') ||
        prevEditorState.isEmpty()
      ) {
        return
      }

      void handleEditorChange(queryRef.current, isCaseSensitiveRef.current)
    })
  }, [editor, handleEditorChange, isCaseSensitiveRef, queryRef])

  useEffect(() => {
    return addReplaceEventListener((event) => {
      const { replace, type } = event

      const replaceResult = (result: SuperSearchResult, scrollIntoView = false) => {
        const { node, startIndex, endIndex } = result
        const lexicalNode = $getNearestNodeFromDOMNode(node)
        if (!lexicalNode) {
          return
        }
        if (lexicalNode instanceof TextNode) {
          lexicalNode.spliceText(startIndex, endIndex - startIndex, replace, true)
        }
        if (scrollIntoView && node.parentElement) {
          node.parentElement.scrollIntoView({
            block: 'center',
          })
        }
      }

      editor.update(() => {
        if (type === 'next') {
          const result = resultsRef.current[currentResultIndexRef.current]
          if (!result) {
            return
          }
          replaceResult(result, true)
        } else if (type === 'all') {
          const results = resultsRef.current
          for (const result of results) {
            replaceResult(result)
          }
        }

        void handleSearch(queryRef.current, isCaseSensitiveRef.current)
      })
    })
  }, [addReplaceEventListener, currentResultIndexRef, editor, handleSearch, isCaseSensitiveRef, queryRef, resultsRef])

  useEffect(() => {
    const currentHighlights = document.querySelectorAll('.search-highlight')
    for (const element of currentHighlights) {
      element.remove()
    }
    if (currentResultIndex === -1) {
      return
    }
    const result = results[currentResultIndex]
    editor.getEditorState().read(() => {
      const rootElement = editor.getRootElement()
      const containerElement = rootElement?.parentElement?.getElementsByClassName('search-highlight-container')[0]
      result.node.parentElement?.scrollIntoView({
        block: 'center',
      })
      if (!rootElement || !containerElement) {
        return
      }
      createSearchHighlightElement(result, rootElement, containerElement)
    })
  }, [currentResultIndex, editor, results])

  useEffect(() => {
    let containerElement: HTMLElement | null | undefined
    let rootElement: HTMLElement | null | undefined

    editor.getEditorState().read(() => {
      rootElement = editor.getRootElement()
      containerElement = rootElement?.parentElement?.querySelector('.search-highlight-container')
    })

    if (!rootElement || !containerElement) {
      return
    }

    const resizeObserver = new ResizeObserver(() => {
      if (!rootElement || !containerElement) {
        return
      }

      containerElement.style.height = `${rootElement.scrollHeight}px`
      containerElement.style.overflow = 'visible'
    })
    resizeObserver.observe(rootElement)

    const handleScroll = () => {
      if (!rootElement || !containerElement) {
        return
      }

      containerElement.style.top = `-${rootElement.scrollTop}px`
    }

    rootElement.addEventListener('scroll', handleScroll)

    return () => {
      resizeObserver.disconnect()
      rootElement?.removeEventListener('scroll', handleScroll)
    }
  }, [editor])

  const selectCurrentResult = useCallback(() => {
    if (results.length === 0) {
      return
    }
    const result = results[currentResultIndex]
    if (!result) {
      return
    }
    editor.update(() => {
      const rangeSelection = $createRangeSelection()
      $setSelection(rangeSelection)

      const lexicalNode = $getNearestNodeFromDOMNode(result.node)
      if ($isTextNode(lexicalNode)) {
        lexicalNode.select(result.startIndex, result.endIndex)
      }
    })
  }, [currentResultIndex, editor, results])

  return (
    <>
      <SearchDialog
        open={isSearchActive}
        closeDialog={() => {
          selectCurrentResult()
          dispatch({ type: 'toggle-search' })
          dispatch({ type: 'reset-search' })
          editor.focus()
        }}
      />
    </>
  )
}
