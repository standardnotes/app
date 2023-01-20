import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useState } from 'react'
import { BlocksEditor, BlocksEditorComposer } from '@standardnotes/blocks-editor'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import MarkdownPreviewPlugin from './Plugins/MarkdownPreviewPlugin/MarkdownPreviewPlugin'
import { FileNode } from './Plugins/EncryptedFilePlugin/Nodes/FileNode'
import { BubbleNode } from './Plugins/ItemBubblePlugin/Nodes/BubbleNode'
import { copyTextToClipboard } from '../../../Utils/copyTextToClipboard'
import Modal from '@/Components/Shared/Modal'
import { useModalState } from '@/Components/Shared/ModalState'

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

  const modalState = useModalState({
    title: 'Markdown Preview',
    isOpen: true,
    close: closeDialog,
    actions: [
      {
        label: didCopy ? 'Copied' : 'Copy',
        type: 'primary',
        onClick: copy,
        mobileSlot: 'left',
      },
    ],
  })

  return (
    <Modal state={modalState}>
      <div className="relative w-full px-4 py-4">
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
    </Modal>
  )
}
