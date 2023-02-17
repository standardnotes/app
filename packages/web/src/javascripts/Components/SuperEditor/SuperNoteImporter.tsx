import { WebApplication } from '@/Application/Application'
import { NoteType, SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import ImportPlugin from './Plugins/ImportPlugin/ImportPlugin'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { spaceSeparatedStrings } from '@standardnotes/utils'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { BlocksEditor } from './BlocksEditor'
import { BlocksEditorComposer } from './BlocksEditorComposer'

const NotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  note: SNNote
  closeDialog: () => void
  onConvertComplete: () => void
}

export const SuperNoteImporter: FunctionComponent<Props> = ({ note, application, closeDialog, onConvertComplete }) => {
  const isSeamlessConvert = note.text.length === 0
  const [lastValue, setLastValue] = useState({ text: '', previewPlain: '' })

  const format =
    !note.noteType || [NoteType.Plain, NoteType.Markdown, NoteType.Code, NoteType.Task].includes(note.noteType)
      ? 'md'
      : 'html'

  const handleChange = useCallback((value: string, preview: string) => {
    setLastValue({ text: value, previewPlain: preview })
  }, [])

  const performConvert = useCallback(
    async (text: string, previewPlain: string) => {
      const controller = new NoteViewController(application, note)
      await controller.initialize()
      await controller.saveAndAwaitLocalPropagation({
        text: text,
        previews: { previewPlain: previewPlain, previewHtml: undefined },
        isUserModified: true,
        bypassDebouncer: true,
      })
    },
    [application, note],
  )

  const confirmConvert = useCallback(async () => {
    closeDialog()

    await performConvert(lastValue.text, lastValue.previewPlain)

    onConvertComplete()
  }, [closeDialog, performConvert, onConvertComplete, lastValue])

  useEffect(() => {
    if (isSeamlessConvert) {
      void confirmConvert()
    }
  }, [isSeamlessConvert, confirmConvert])

  const convertAsIs = useCallback(async () => {
    const confirmed = await application.alertService.confirm(
      spaceSeparatedStrings(
        "This option is useful if you switched this note's type from Super to another plaintext-based format, and want to return to Super.",
        'To use this option, the preview in the convert window should display a language format known as JSON.',
        'If this is not the case, cancel this prompt.',
      ),
      'Are you sure?',
    )
    if (!confirmed) {
      return
    }

    closeDialog()

    await performConvert(note.text, note.preview_plain)

    onConvertComplete()
  }, [closeDialog, application, note, onConvertComplete, performConvert])

  const modalActions: ModalAction[] = useMemo(
    () => [
      {
        label: 'Cancel',
        onClick: closeDialog,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: 'Convert',
        onClick: confirmConvert,
        mobileSlot: 'right',
        type: 'primary',
      },
      {
        label: 'Convert As-Is',
        onClick: convertAsIs,
        type: 'secondary',
      },
    ],
    [closeDialog, confirmConvert, convertAsIs],
  )

  if (isSeamlessConvert) {
    return null
  }

  return (
    <Modal title="Convert to Super note" close={closeDialog} actions={modalActions}>
      <div className="border-b border-border px-4 py-4 text-sm font-normal text-neutral md:py-3">
        The following is a preview of how your note will look when converted to Super. Super notes use a custom format
        under the hood. Converting your note will transition it from plaintext to the custom Super format.
      </div>
      <div className="relative w-full px-4 py-4">
        <ErrorBoundary>
          <BlocksEditorComposer readonly initialValue={undefined}>
            <BlocksEditor
              readonly
              onChange={handleChange}
              ignoreFirstChange={false}
              className="relative resize-none text-base focus:shadow-none focus:outline-none"
              previewLength={NotePreviewCharLimit}
              spellcheck={note.spellcheck}
            >
              <ImportPlugin text={note.text} format={format} onChange={handleChange} />
            </BlocksEditor>
          </BlocksEditorComposer>
        </ErrorBoundary>
      </div>
    </Modal>
  )
}
