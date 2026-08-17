import { WebApplication } from '@/Application/WebApplication'
import { usePrevious } from '@/Components/ContentListView/Calendar/usePrevious'
import { ElementIds } from '@/Constants/ElementIDs'
import { log, LoggingDomain } from '@/Logging'
import { Disposer } from '@/Types/Disposer'
import { EditorEventSource } from '@/Types/EditorEventSource'
import { classNames } from '@standardnotes/utils'
import { useResponsiveEditorFontSize } from '@/Utils/getPlaintextFontSize'
import {
  ApplicationEvent,
  EditorFontSize,
  EditorLineHeight,
  isPayloadSourceRetrieved,
  WebAppEvent,
  PrefDefaults,
  LocalPrefKey,
} from '@standardnotes/snjs'
import { isIOS, TAB_COMMAND } from '@standardnotes/ui-services'
import {
  ChangeEventHandler,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  FocusEvent,
} from 'react'
import { NoteViewController } from '../Controller/NoteViewController'
import { findStringMatches } from '../UniversalSearch/findStringMatches'
import { PlainEditorSearchBackdrop } from './search/PlainEditorSearchBackdrop'
import { buildPlainSearchHighlightHtml } from './search/buildPlainSearchHighlightHtml'
import { replaceAllTextRangesWithUndoSupport, replaceTextRangeWithUndoSupport } from './replacePlainTextWithUndoSupport'
import { scrollPlainTextareaToOffset } from './search/scrollPlainTextareaToOffset'
import { TextRange } from '../UniversalSearch/types'

export type PlainEditorSearchHighlightState = {
  isOpen: boolean
  query: string
  isCaseSensitive: boolean
  shouldHighlightAll: boolean
  activeMatch?: TextRange
}

type Props = {
  application: WebApplication
  spellcheck: boolean
  controller: NoteViewController
  locked: boolean
  onFocus: () => void
  onBlur: (event: FocusEvent) => void
  onTextChange?: () => void
  isSearchMode?: boolean
  search?: PlainEditorSearchHighlightState
}

export type PlainEditorInterface = {
  focus: () => void
  getText: () => string
  getTextarea: () => HTMLTextAreaElement | null
  setSelection: (
    start: number,
    end: number,
    options?: { focus?: boolean; scrollIntoView?: boolean; selectInEditor?: boolean },
  ) => void
  replaceRange: (start: number, end: number, replacement: string) => Promise<void>
  replaceAllRanges: (ranges: TextRange[], replacement: string) => Promise<void>
  onTextChange: (callback: () => void) => Disposer
}

export const PlainEditor = forwardRef<PlainEditorInterface, Props>(
  ({ application, spellcheck, controller, locked, onFocus, onBlur, onTextChange, isSearchMode, search }, ref) => {
    const [editorText, setEditorText] = useState<string | undefined>()
    const [textareaUnloading, setTextareaUnloading] = useState(false)
    const [lineHeight, setLineHeight] = useState<EditorLineHeight | undefined>()
    const [fontSize, setFontSize] = useState<EditorFontSize | undefined>()
    const responsiveFontSize = useResponsiveEditorFontSize(fontSize || EditorFontSize.Normal)
    const previousSpellcheck = usePrevious(spellcheck)

    const lastEditorFocusEventSource = useRef<EditorEventSource | undefined>()
    const needsAdjustMobileCursor = useRef(false)
    const isAdjustingMobileCursor = useRef(false)
    const note = useRef(controller.item)

    const [isPendingLocalPropagation, setIsPendingLocalPropagation] = useState(false)

    const tabObserverDisposer = useRef<Disposer>()
    const mutationObserver = useRef<MutationObserver | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)
    const textChangeObservers = useRef(new Set<() => void>())

    const notifyTextChange = useCallback(() => {
      onTextChange?.()
      textChangeObservers.current.forEach((observer) => observer())
    }, [onTextChange])

    const persistText = useCallback(
      (text: string, options?: { bypassDebouncer?: boolean }) => {
        setEditorText(text)
        setIsPendingLocalPropagation(true)

        return controller
          .saveAndAwaitLocalPropagation({
            text,
            isUserModified: true,
            bypassDebouncer: options?.bypassDebouncer,
          })
          .then(() => {
            setIsPendingLocalPropagation(false)
          })
      },
      [controller],
    )

    const focusEditor = useCallback(() => {
      const element = document.getElementById(ElementIds.NoteTextEditor)
      if (element) {
        lastEditorFocusEventSource.current = EditorEventSource.Script
        element.focus()
      }
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        focus() {
          focusEditor()
        },
        getText() {
          return textareaRef.current?.value ?? editorText ?? ''
        },
        getTextarea() {
          return textareaRef.current
        },
        setSelection(start, end, options) {
          const textarea = textareaRef.current
          if (!textarea) {
            return
          }

          const scrollTopBefore = textarea.scrollTop
          const shouldSelectInEditor = options?.selectInEditor ?? !search?.isOpen

          if (!shouldSelectInEditor) {
            if (options?.scrollIntoView !== false) {
              scrollPlainTextareaToOffset(textarea, start, end)
            } else {
              textarea.scrollTop = scrollTopBefore
            }
            return
          }

          textarea.setSelectionRange(start, end)

          if (options?.scrollIntoView !== false) {
            scrollPlainTextareaToOffset(textarea, start, end)
          } else {
            textarea.scrollTop = scrollTopBefore
          }

          if (options?.focus) {
            lastEditorFocusEventSource.current = EditorEventSource.Script
            textarea.focus()
          }
        },
        async replaceRange(start, end, replacement) {
          const textarea = textareaRef.current
          if (!textarea || locked) {
            return
          }

          const nextText = replaceTextRangeWithUndoSupport(textarea, start, end, replacement)

          void persistText(nextText, { bypassDebouncer: true })

          if (!search?.isOpen) {
            notifyTextChange()
          }
        },
        async replaceAllRanges(ranges, replacement) {
          const textarea = textareaRef.current
          if (!textarea || locked || ranges.length < 1) {
            return
          }

          const nextText = replaceAllTextRangesWithUndoSupport(textarea, ranges, replacement)

          void persistText(nextText, { bypassDebouncer: true })

          if (!search?.isOpen) {
            notifyTextChange()
          }
        },
        onTextChange(callback) {
          textChangeObservers.current.add(callback)
          return () => {
            textChangeObservers.current.delete(callback)
          }
        },
      }),
      [editorText, focusEditor, locked, notifyTextChange, persistText, search?.isOpen],
    )

    useEffect(() => {
      return () => {
        mutationObserver.current?.disconnect()
        tabObserverDisposer.current?.()
        tabObserverDisposer.current = undefined
        mutationObserver.current = null
      }
    }, [])

    useEffect(() => {
      const disposer = controller.addNoteInnerValueChangeObserver((updatedNote, source) => {
        if (updatedNote.uuid !== note.current.uuid) {
          throw Error('Editor received changes for non-current note')
        }

        if (!isPendingLocalPropagation) {
          if (
            isPayloadSourceRetrieved(source) ||
            editorText == undefined ||
            updatedNote.editorIdentifier !== note.current.editorIdentifier ||
            updatedNote.noteType !== note.current.noteType
          ) {
            setEditorText(updatedNote.text)
            notifyTextChange()
          }
        }

        note.current = updatedNote
      })

      return disposer
    }, [
      controller,
      editorText,
      controller.item.uuid,
      controller.item.editorIdentifier,
      controller.item.noteType,
      isPendingLocalPropagation,
      notifyTextChange,
    ])

    const onTextAreaChange: ChangeEventHandler<HTMLTextAreaElement> = ({ currentTarget }) => {
      const text = currentTarget.value

      void persistText(text).then(() => {
        notifyTextChange()
      })
    }

    const onContentFocus = useCallback(() => {
      if (!isAdjustingMobileCursor.current) {
        needsAdjustMobileCursor.current = true
      }

      application.notifyWebEvent(WebAppEvent.EditorDidFocus, { eventSource: lastEditorFocusEventSource.current })

      lastEditorFocusEventSource.current = undefined

      onFocus()
    }, [application, isAdjustingMobileCursor, lastEditorFocusEventSource, onFocus])

    const onContentBlur = useCallback(
      (event: FocusEvent) => {
        lastEditorFocusEventSource.current = undefined

        onBlur(event)
      },
      [lastEditorFocusEventSource, onBlur],
    )

    const scrollMobileCursorIntoViewAfterWebviewResize = useCallback(() => {
      if (needsAdjustMobileCursor.current) {
        needsAdjustMobileCursor.current = false
        isAdjustingMobileCursor.current = true
        document.getElementById('note-text-editor')?.blur()
        document.getElementById('note-text-editor')?.focus()
        isAdjustingMobileCursor.current = false
      }
    }, [needsAdjustMobileCursor])

    useEffect(() => {
      const disposer = application.addWebEventObserver((event) => {
        if (event === WebAppEvent.MobileKeyboardWillChangeFrame) {
          scrollMobileCursorIntoViewAfterWebviewResize()
        }
      })
      return disposer
    }, [application, scrollMobileCursorIntoViewAfterWebviewResize])

    useEffect(() => {
      const shouldFocus = controller.isTemplateNote && controller.templateNoteOptions?.autofocusBehavior === 'editor'

      if (shouldFocus) {
        focusEditor()
      }
    }, [controller, focusEditor])

    const reloadPreferences = useCallback(() => {
      const lineHeight = application.preferences.getLocalValue(
        LocalPrefKey.EditorLineHeight,
        PrefDefaults[LocalPrefKey.EditorLineHeight],
      )
      const fontSize = application.preferences.getLocalValue(
        LocalPrefKey.EditorFontSize,
        PrefDefaults[LocalPrefKey.EditorFontSize],
      )

      setLineHeight(lineHeight)
      setFontSize(fontSize)
    }, [application])

    useEffect(() => {
      reloadPreferences()

      return application.addEventObserver(async (event) => {
        const events = [ApplicationEvent.PreferencesChanged, ApplicationEvent.LocalPreferencesChanged]
        if (events.includes(event)) {
          reloadPreferences()
        }
      })
    }, [reloadPreferences, application])

    useEffect(() => {
      if (previousSpellcheck === undefined) {
        return
      }

      if (spellcheck !== previousSpellcheck) {
        setTextareaUnloading(true)
        setTimeout(() => {
          setTextareaUnloading(false)
        }, 0)
      }
    }, [spellcheck, previousSpellcheck])

    const onRef = useCallback(
      (element: HTMLTextAreaElement | null) => {
        textareaRef.current = element

        if (tabObserverDisposer.current || !element) {
          return
        }

        log(LoggingDomain.NoteView, 'On system editor ref')

        /**
         * Insert 4 spaces when a tab key is pressed, only used when inside of the text editor.
         * If the shift key is pressed first, this event is not fired.
         */
        const editor = document.getElementById(ElementIds.NoteTextEditor) as HTMLInputElement

        if (!editor) {
          console.error('Editor is not yet mounted; unable to add tab observer.')
          return
        }

        tabObserverDisposer.current = application.keyboardService.addCommandHandler({
          element: editor,
          command: TAB_COMMAND,
          onKeyDown: (event) => {
            if (document.hidden || note.current.locked || event.shiftKey) {
              return
            }
            event.preventDefault()
            /** Using document.execCommand gives us undo support */
            const insertSuccessful = document.execCommand('insertText', false, '\t')
            if (!insertSuccessful) {
              /** document.execCommand works great on Chrome/Safari but not Firefox */
              const start = editor.selectionStart || 0
              const end = editor.selectionEnd || 0
              const spaces = '    '
              /** Insert 4 spaces */
              editor.value = editor.value.substring(0, start) + spaces + editor.value.substring(end)
              /** Place cursor 4 spaces away from where the tab key was pressed */
              editor.selectionStart = editor.selectionEnd = start + 4
            }

            void persistText(editor.value).then(() => {
              notifyTextChange()
            })
          },
        })

        const observer = new MutationObserver((records) => {
          for (const record of records) {
            record.removedNodes.forEach((node) => {
              if (node.isEqualNode(editor)) {
                tabObserverDisposer.current?.()
                tabObserverDisposer.current = undefined
                observer.disconnect()
              }
            })
          }
        })

        observer.observe(editor.parentElement as HTMLElement, { childList: true })

        mutationObserver.current = observer
      },
      [application.keyboardService, notifyTextChange, persistText],
    )

    const {
      isOpen: searchIsOpen = false,
      query: searchQuery = '',
      isCaseSensitive: searchIsCaseSensitive = false,
      shouldHighlightAll: searchShouldHighlightAll = false,
      activeMatch: searchActiveMatch,
    } = search ?? {}

    const searchHighlightHtml = useMemo(() => {
      if (!searchIsOpen || !searchQuery) {
        return null
      }

      const text = editorText ?? ''
      const matches = findStringMatches(text, searchQuery, searchIsCaseSensitive)

      return buildPlainSearchHighlightHtml(
        {
          isOpen: true,
          query: searchQuery,
          results: matches.map((range) => ({ id: `plain-${range.start}`, payload: range })),
          currentResult: searchActiveMatch ? { id: 'active', payload: searchActiveMatch } : undefined,
          shouldHighlightAll: searchShouldHighlightAll,
        },
        () => text,
      )
    }, [editorText, searchIsOpen, searchQuery, searchIsCaseSensitive, searchShouldHighlightAll, searchActiveMatch])

    if (textareaUnloading) {
      return null
    }

    const editorTypographyClassName = classNames(
      lineHeight && `leading-${lineHeight.toLowerCase()}`,
      responsiveFontSize,
    )

    const textareaClassName = classNames(
      'editable font-editor flex-grow',
      editorTypographyClassName,
      searchHighlightHtml != null && 'plain-editor-with-search-highlights',
      isIOS() && '!pb-12',
    )

    const textareaElement = (
      <textarea
        autoComplete="off"
        dir="auto"
        id={ElementIds.NoteTextEditor}
        onChange={onTextAreaChange}
        onFocus={onContentFocus}
        onBlur={onContentBlur}
        readOnly={locked}
        ref={onRef}
        spellCheck={spellcheck}
        value={editorText}
        className={textareaClassName}
      ></textarea>
    )

    if (!isSearchMode) {
      return textareaElement
    }

    return (
      <div className="plain-editor-search-container relative flex min-h-0 flex-grow flex-col">
        {searchHighlightHtml != null && (
          <PlainEditorSearchBackdrop
            html={searchHighlightHtml}
            textareaRef={textareaRef}
            typographyClassName={editorTypographyClassName}
            syncDependency={editorText}
          />
        )}
        {textareaElement}
      </div>
    )
  },
)
