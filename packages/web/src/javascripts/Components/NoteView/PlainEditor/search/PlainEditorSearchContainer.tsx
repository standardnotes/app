import { ComponentProps, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useApplication } from '@/Components/ApplicationProvider'
import { useKeyboardService } from '@/Components/KeyboardServiceProvider'
import {
  keyboardStringForShortcut,
  UNIVERSAL_SEARCH_TOGGLE_CASE_SENSITIVE,
  UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE,
  UNIVERSAL_TOGGLE_SEARCH,
} from '@standardnotes/ui-services'
import { UniversalSearchController } from '../../UniversalSearch/UniversalSearchController'
import { registerUniversalSearchKeyboardHandlers } from '../../UniversalSearch/registerUniversalSearchKeyboardHandlers'
import { createPlainEditorUniversalSearchProvider } from '../../UniversalSearch/providers/PlainEditorUniversalSearchProvider'
import { UniversalSearchShell } from '../../UniversalSearch/UniversalSearchShell'
import { PlainEditor, PlainEditorInterface } from '../PlainEditor'

type PlainEditorProps = ComponentProps<typeof PlainEditor>

export const PlainEditorSearchContainer = observer(
  forwardRef<PlainEditorInterface, PlainEditorProps>(function PlainEditorSearchContainer(props, ref) {
    const application = useApplication()
    const keyboardService = useKeyboardService()
    const plainEditorRef = useRef<PlainEditorInterface | null>(null)
    const isUniversalSearchEnabled = application.featuresController.isUniversalSearchEnabled()

    const noteUuid = props.controller.item.uuid

    const controller = useMemo(() => {
      if (!isUniversalSearchEnabled) {
        return undefined
      }

      const provider = createPlainEditorUniversalSearchProvider({
        getEditor: () => plainEditorRef.current ?? undefined,
      })

      return new UniversalSearchController(provider)
    }, [isUniversalSearchEnabled])

    useEffect(() => {
      controller?.resetContext()
    }, [noteUuid, controller])

    useImperativeHandle(
      ref,
      () => ({
        focus: () => plainEditorRef.current?.focus(),
        getText: () => plainEditorRef.current?.getText() ?? '',
        getTextarea: () => plainEditorRef.current?.getTextarea() ?? null,
        setSelection: (start, end, options) => plainEditorRef.current?.setSelection(start, end, options),
        replaceRange: async (start, end, replacement) => {
          await plainEditorRef.current?.replaceRange(start, end, replacement)
        },
        replaceAllRanges: async (ranges, replacement) => {
          await plainEditorRef.current?.replaceAllRanges(ranges, replacement)
        },
        onTextChange: (callback) => plainEditorRef.current?.onTextChange(callback) ?? (() => undefined),
      }),
      [],
    )

    useEffect(() => {
      return () => {
        controller?.deinit()
      }
    }, [controller])

    const wasSearchOpenRef = useRef(false)

    useEffect(() => {
      if (wasSearchOpenRef.current && !controller?.isOpen) {
        plainEditorRef.current?.focus()
      }

      wasSearchOpenRef.current = controller?.isOpen ?? false
    }, [controller?.isOpen])

    const handleTextChange = useCallback(() => {
      if (!controller?.isOpen) {
        return
      }

      controller.refreshSearch()
    }, [controller])

    useEffect(() => {
      if (!controller || !isUniversalSearchEnabled) {
        return
      }

      return registerUniversalSearchKeyboardHandlers(keyboardService, controller)
    }, [controller, isUniversalSearchEnabled, keyboardService])

    const setPlainEditorRef = useCallback((editor: PlainEditorInterface | null) => {
      plainEditorRef.current = editor
    }, [])

    const search = controller
      ? {
          isOpen: controller.isOpen,
          query: controller.query,
          isCaseSensitive: controller.isCaseSensitive,
          shouldHighlightAll: controller.shouldHighlightAll,
          activeMatch: controller.currentResult?.payload,
        }
      : undefined

    const searchToggleShortcut = keyboardStringForShortcut(
      keyboardService.keyboardShortcutForCommand(UNIVERSAL_TOGGLE_SEARCH),
    )
    const toggleReplaceShortcut = keyboardStringForShortcut(
      keyboardService.keyboardShortcutForCommand(UNIVERSAL_SEARCH_TOGGLE_REPLACE_MODE),
    )
    const caseSensitivityShortcut = keyboardStringForShortcut(
      keyboardService.keyboardShortcutForCommand(UNIVERSAL_SEARCH_TOGGLE_CASE_SENSITIVE),
    )

    if (!isUniversalSearchEnabled || !controller) {
      return <PlainEditor {...props} ref={setPlainEditorRef} />
    }

    return (
      <div className="relative flex flex-grow flex-col">
        <UniversalSearchShell
          controller={controller}
          locked={props.locked}
          closeShortcut={searchToggleShortcut}
          replaceShortcut={toggleReplaceShortcut}
          caseSensitivityShortcut={caseSensitivityShortcut}
        />
        <PlainEditor {...props} ref={setPlainEditorRef} isSearchMode onTextChange={handleTextChange} search={search} />
      </div>
    )
  }),
)
