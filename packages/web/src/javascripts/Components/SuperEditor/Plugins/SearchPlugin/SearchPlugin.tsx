import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../../ApplicationProvider'
import {
  SUPER_TOGGLE_SEARCH,
  SUPER_SEARCH_TOGGLE_REPLACE_MODE,
  SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
  SUPER_SEARCH_NEXT_RESULT,
  SUPER_SEARCH_PREVIOUS_RESULT,
  KeyboardKey,
  keyboardStringForShortcut,
} from '@standardnotes/ui-services'
import { TranslateFromTopAnimation, TranslateToTopAnimation } from '../../../../Constants/AnimationConfigs'
import { useLifecycleAnimation } from '../../../../Hooks/useLifecycleAnimation'
import { classNames, debounce } from '@standardnotes/utils'
import DecoratedInput from '../../../Input/DecoratedInput'
import { searchInElement } from './searchInElement'
import { useKeyboardService } from '../../../KeyboardServiceProvider'
import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, CloseIcon } from '@standardnotes/icons'
import Button from '../../../Button/Button'
import { canUseCSSHiglights, SearchHighlightRenderer, SearchHighlightRendererMethods } from './SearchHighlightRenderer'
import { useStateRef } from '../../../../Hooks/useStateRef'
import { createPortal } from 'react-dom'
import { $createRangeSelection, $getSelection, $setSelection } from 'lexical'
import StyledTooltip from '../../../StyledTooltip/StyledTooltip'
import Icon from '../../../Icon/Icon'

export function SearchPlugin() {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()

  const [isSearchActive, setIsSearchActive] = useState(false)

  const [query, setQuery] = useState('')
  const queryRef = useStateRef(query)
  const [results, setResults] = useState<Range[]>([])

  const [isCaseSensitive, setIsCaseSensitive] = useState(false)
  const isCaseSensitiveRef = useStateRef(isCaseSensitive)
  const toggleCaseSensitivity = useCallback(() => setIsCaseSensitive((sensitive) => !sensitive), [])

  const [isReplaceMode, setIsReplaceMode] = useState(false)
  const toggleReplaceMode = useCallback(() => setIsReplaceMode((enabled) => !enabled), [])
  const [replaceQuery, setReplaceQuery] = useState('')

  const highlightRendererRef = useRef<SearchHighlightRendererMethods>(null)

  const [currentResultIndex, setCurrentResultIndex] = useState(-1)
  const highlightAndScrollResultIntoView = useCallback(
    (index: number) => {
      const result = results[index]
      if (!result) {
        return
      }
      highlightRendererRef.current?.setActiveHighlight(result)
      result.startContainer.parentElement?.scrollIntoView({
        block: 'center',
      })
    },
    [results],
  )
  const goToNextResult = useCallback(() => {
    let next = currentResultIndex + 1
    if (next >= results.length) {
      next = 0
    }
    highlightAndScrollResultIntoView(next)
    setCurrentResultIndex(next)
  }, [currentResultIndex, highlightAndScrollResultIntoView, results.length])
  const goToPrevResult = useCallback(() => {
    let prev = currentResultIndex - 1
    if (prev < 0) {
      prev = results.length - 1
    }
    highlightAndScrollResultIntoView(prev)
    setCurrentResultIndex(prev)
  }, [currentResultIndex, highlightAndScrollResultIntoView, results.length])

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
      rangeSelection.applyDOMRange(result)
      $setSelection(rangeSelection)
    })
  }, [currentResultIndex, editor, results])

  const [shouldHighlightAll, setShouldHighlightAll] = useState(canUseCSSHiglights)

  const closeDialog = useCallback(() => {
    selectCurrentResult()
    setIsSearchActive(false)
    setQuery('')
    setResults([])
    setIsCaseSensitive(false)
    setIsReplaceMode(false)
    setReplaceQuery('')
    setShouldHighlightAll(canUseCSSHiglights)
    editor.update(() => {
      if ($getSelection() !== null) {
        editor.focus()
      }
    })
  }, [editor, selectCurrentResult])

  useEffect(() => {
    return application.keyboardService.addCommandHandlers([
      {
        command: SUPER_TOGGLE_SEARCH,
        category: 'Super notes',
        description: 'Search in current note',
        onKeyDown: (event) => {
          event.preventDefault()
          event.stopPropagation()
          setIsSearchActive((active) => !active)
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
          toggleReplaceMode()
        },
      },
      {
        command: SUPER_SEARCH_TOGGLE_CASE_SENSITIVE,
        onKeyDown() {
          toggleCaseSensitivity()
        },
      },
      {
        command: SUPER_SEARCH_NEXT_RESULT,
        category: 'Super notes',
        description: 'Go to next search result',
        onKeyDown(event) {
          event.preventDefault()
          event.stopPropagation()
          goToNextResult()
        },
      },
      {
        command: SUPER_SEARCH_PREVIOUS_RESULT,
        category: 'Super notes',
        description: 'Go to previous search result',
        onKeyDown(event) {
          event.preventDefault()
          event.stopPropagation()
          goToPrevResult()
        },
      },
    ])
  }, [application.keyboardService, editor, goToNextResult, goToPrevResult, toggleCaseSensitivity, toggleReplaceMode])

  const searchQueryAndHighlight = useCallback(
    (query: string, isCaseSensitive: boolean) => {
      const highlightRenderer = highlightRendererRef.current
      const rootElement = editor.getRootElement()
      if (!rootElement || !query) {
        highlightRenderer?.clearHighlights()
        return
      }
      highlightRenderer?.clearHighlights()
      const ranges = searchInElement(rootElement, query, isCaseSensitive)
      setResults(ranges)
      highlightRenderer?.highlightMultipleRanges(ranges)
      if (ranges.length > 0) {
        setCurrentResultIndex(0)
        highlightRenderer?.setActiveHighlight(ranges[0])
      } else {
        setCurrentResultIndex(-1)
      }
    },
    [editor],
  )

  const handleQueryChange = useMemo(() => debounce(searchQueryAndHighlight, 30), [searchQueryAndHighlight])
  const handleEditorChange = useMemo(() => debounce(searchQueryAndHighlight, 250), [searchQueryAndHighlight])

  useEffect(() => {
    void handleQueryChange(query, isCaseSensitive)
  }, [handleQueryChange, isCaseSensitive, query])

  useEffect(() => {
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

  const $replaceResult = useCallback(
    (result: Range, scrollIntoView = false) => {
      const selection = $createRangeSelection()
      selection.applyDOMRange(result)
      selection.insertText(replaceQuery)
      const nodeParent = result.startContainer.parentElement
      if (nodeParent && scrollIntoView) {
        nodeParent.scrollIntoView({
          block: 'center',
        })
      }
    },
    [replaceQuery],
  )

  const replaceCurrentResult = useCallback(() => {
    const currentResult = results[currentResultIndex]
    if (!currentResult) {
      return
    }
    editor.update(
      () => {
        $replaceResult(currentResult, true)
      },
      {
        discrete: true,
        tag: 'skip-dom-selection',
      },
    )
    searchQueryAndHighlight(query, isCaseSensitive)
  }, [$replaceResult, currentResultIndex, editor, isCaseSensitive, query, results, searchQueryAndHighlight])

  const replaceAllResults = useCallback(() => {
    if (results.length === 0) {
      return
    }
    editor.update(
      () => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          if (!result) {
            continue
          }
          $replaceResult(result, false)
        }
      },
      {
        discrete: true,
        tag: 'skip-dom-selection',
      },
    )
    searchQueryAndHighlight(query, isCaseSensitive)
  }, [$replaceResult, editor, isCaseSensitive, query, results, searchQueryAndHighlight])

  const [isMounted, setElement] = useLifecycleAnimation({
    open: isSearchActive,
    enter: TranslateFromTopAnimation,
    exit: TranslateToTopAnimation,
  })

  const focusOnMount = useCallback((node: HTMLInputElement | null) => {
    if (node) {
      node.focus()
    }
  }, [])

  const keyboardService = useKeyboardService()
  const searchToggleShortcut = useMemo(
    () => keyboardStringForShortcut(keyboardService.keyboardShortcutForCommand(SUPER_TOGGLE_SEARCH)),
    [keyboardService],
  )
  const toggleReplaceShortcut = useMemo(
    () => keyboardStringForShortcut(keyboardService.keyboardShortcutForCommand(SUPER_SEARCH_TOGGLE_REPLACE_MODE)),
    [keyboardService],
  )
  const caseSensitivityShortcut = useMemo(
    () => keyboardStringForShortcut(keyboardService.keyboardShortcutForCommand(SUPER_SEARCH_TOGGLE_CASE_SENSITIVE)),
    [keyboardService],
  )

  if (!isMounted) {
    return null
  }

  return (
    <>
      <div
        className={classNames(
          'absolute left-2 right-6 top-2 z-10 flex select-none rounded border border-border bg-default font-sans md:left-auto',
          editor.isEditable() ? 'md:top-13' : 'md:top-3',
        )}
        ref={setElement}
      >
        {editor.isEditable() && (
          <button
            className="focus:ring-none border-r border-border px-1 hover:bg-contrast focus:shadow-inner focus:shadow-info"
            onClick={toggleReplaceMode}
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
              onChange={setQuery}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && results.length) {
                  if (event.shiftKey) {
                    goToPrevResult()
                    return
                  }
                  goToNextResult()
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
                onChange={toggleCaseSensitivity}
              />
              <span aria-hidden>Aa</span>
              <span className="sr-only">Case sensitive</span>
            </label>
            <button
              className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
              onClick={goToPrevResult}
              disabled={results.length < 1}
              title="Previous result (Shift + Enter)"
            >
              <ArrowUpIcon className="h-4 w-4 fill-current text-text" />
            </button>
            <button
              className="flex items-center rounded border border-border p-1.5 hover:bg-contrast disabled:cursor-not-allowed"
              onClick={goToNextResult}
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
                      replaceAllResults()
                      event.preventDefault()
                      return
                    }
                    replaceCurrentResult()
                    event.preventDefault()
                  }
                }}
                className="rounded border border-border bg-default p-1 px-2"
                ref={focusOnMount}
              />
              <Button
                small
                onClick={replaceCurrentResult}
                disabled={results.length < 1 || replaceQuery.length < 1}
                title="Replace (Ctrl + Enter)"
              >
                Replace
              </Button>
              <Button
                small
                onClick={replaceAllResults}
                disabled={results.length < 1 || replaceQuery.length < 1}
                title="Replace all (Ctrl + Alt + Enter)"
              >
                Replace all
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                className="h-4 w-4 rounded accent-info"
                type="checkbox"
                checked={shouldHighlightAll}
                onChange={(e) => setShouldHighlightAll(e.target.checked)}
              />
              <div>Highlight all results</div>
            </label>
            {!canUseCSSHiglights && (
              <StyledTooltip
                label="May lead to performance degradation, especially on large documents."
                className="!z-modal"
                showOnMobile
              >
                <button className="cursor-default">
                  <Icon type="info" size="medium" />
                </button>
              </StyledTooltip>
            )}
          </div>
        </div>
      </div>
      {createPortal(
        <SearchHighlightRenderer shouldHighlightAll={shouldHighlightAll} ref={highlightRendererRef} />,
        editor.getRootElement()?.parentElement || document.body,
      )}
    </>
  )
}
