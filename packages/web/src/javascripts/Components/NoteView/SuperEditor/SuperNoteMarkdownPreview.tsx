import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useState } from 'react'
import { BlocksEditor, BlocksEditorComposer } from '@standardnotes/blocks-editor'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import ModalDialog from '@/Components/Shared/ModalDialog'
import ModalDialogButtons from '@/Components/Shared/ModalDialogButtons'
import ModalDialogDescription from '@/Components/Shared/ModalDialogDescription'
import ModalDialogLabel from '@/Components/Shared/ModalDialogLabel'
import Button from '@/Components/Button/Button'
import MarkdownPreviewPlugin from './Plugins/MarkdownPreviewPlugin/MarkdownPreviewPlugin'
import { FileNode } from './Plugins/EncryptedFilePlugin/Nodes/FileNode'
import { BubbleNode } from './Plugins/ItemBubblePlugin/Nodes/BubbleNode'
import { copyTextToClipboard } from '../../../Utils/copyTextToClipboard'

type Props = {
  note: SNNote
  closeDialog: () => void
}

export const SuperNoteMarkdownPreview: FunctionComponent<Props> = ({ note, closeDialog }) => {
  const [markdown, setMarkdown] = useState('')
  const [didCopy, setDidCopy] = useState(false)

  const copy = useCallback(() => {
    copyTextToClipboard(markdown)
    setDidCopy(true)
    setTimeout(() => {
      setDidCopy(false)
    }, 1500)
  }, [markdown])

  const onMarkdown = useCallback((markdown: string) => {
    setMarkdown(markdown)
  }, [])

  return (
    <ModalDialog>
      <ModalDialogLabel closeDialog={closeDialog}>Markdown Preview</ModalDialogLabel>
      <ModalDialogDescription>
        <div className="relative w-full">
          <ErrorBoundary>
            <BlocksEditorComposer readonly initialValue={note.text} nodes={[FileNode, BubbleNode]}>
              <BlocksEditor
                readonly
                className="relative resize-none text-base focus:shadow-none focus:outline-none"
                spellcheck={note.spellcheck}
              >
                <MarkdownPreviewPlugin onMarkdown={onMarkdown} />
              </BlocksEditor>
            </BlocksEditorComposer>
          </ErrorBoundary>
        </div>
      </ModalDialogDescription>
      <ModalDialogButtons>
        <div className="flex">
          <Button onClick={closeDialog}>Close</Button>
          <div className="min-w-3" />
          <Button primary onClick={copy}>
            {didCopy ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </ModalDialogButtons>
    </ModalDialog>
  )
}
