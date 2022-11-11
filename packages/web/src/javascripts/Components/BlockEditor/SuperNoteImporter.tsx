import { WebApplication } from '@/Application/Application'
import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useState } from 'react'
import { BlockEditorController } from './BlockEditorController'
import { BlocksEditor, BlocksEditorComposer } from '@standardnotes/blocks-editor'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Button from '@/Components/Button/Button'
import ImportPlugin from './Plugins/ImportPlugin/ImportPlugin'

export function spaceSeparatedStrings(...strings: string[]): string {
  return strings.join(' ')
}

const NotePreviewCharLimit = 160

type Props = {
  application: WebApplication
  note: SNNote
  closeDialog: () => void
  onConvertComplete: () => void
}

export const SuperNoteImporter: FunctionComponent<Props> = ({ note, application, closeDialog, onConvertComplete }) => {
  const [lastValue, setLastValue] = useState({ text: '', previewPlain: '' })

  const handleChange = useCallback((value: string, preview: string) => {
    setLastValue({ text: value, previewPlain: preview })
  }, [])

  const confirmConvert = useCallback(() => {
    const controller = new BlockEditorController(note, application)
    void controller.save({ text: lastValue.text, previewPlain: lastValue.previewPlain, previewHtml: undefined })
    closeDialog()
    onConvertComplete()
  }, [closeDialog, application, lastValue, note, onConvertComplete])

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

    const controller = new BlockEditorController(note, application)
    void controller.save({ text: note.text, previewPlain: note.preview_plain, previewHtml: undefined })
    closeDialog()
    onConvertComplete()
  }, [closeDialog, application, note, onConvertComplete])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>
        Convert to Super note
        <p className="text-sm font-normal text-neutral">
          The following is a preview of how your note will look when converted to Super. Super notes use a custom format
          under the hood. Converting your note will transition it from plaintext to the custom Super format.
        </p>
      </ModalDialogLabel>
      <ModalDialogDescription>
        <div className="relative w-full">
          <ErrorBoundary>
            <BlocksEditorComposer readonly initialValue={''}>
              <BlocksEditor
                onChange={handleChange}
                className="relative relative resize-none text-base focus:shadow-none focus:outline-none"
                previewLength={NotePreviewCharLimit}
                spellcheck={note.spellcheck}
              >
                <ImportPlugin text={note.text} />
              </BlocksEditor>
            </BlocksEditorComposer>
          </ErrorBoundary>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <div className="flex w-full justify-between">
          <div>
            <Button onClick={convertAsIs}>Convert As-Is</Button>
          </div>
          <div className="flex">
            <Button onClick={closeDialog}>Cancel</Button>
            <div className="min-w-3" />
            <Button primary onClick={confirmConvert}>
              Convert to Super
            </Button>
          </div>
        </div>
      </ModalDialogButtons>
    </ModalDialog>
  )
}
