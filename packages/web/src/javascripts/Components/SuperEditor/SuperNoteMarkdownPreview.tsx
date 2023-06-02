import { SNNote } from '@standardnotes/snjs'
import { FunctionComponent, useCallback, useMemo, useState } from 'react'
import { ErrorBoundary } from '@/Utils/ErrorBoundary'
import MarkdownPreviewPlugin from './Plugins/MarkdownPreviewPlugin/MarkdownPreviewPlugin'
import { copyTextToClipboard } from '../../Utils/copyTextToClipboard'
import Modal, { ModalAction } from '@/Components/Modal/Modal'
import { BlocksEditor } from './BlocksEditor'
import { BlocksEditorComposer } from './BlocksEditorComposer'
import { MutuallyExclusiveMediaQueryBreakpoints, useMediaQuery } from '@/Hooks/useMediaQuery'

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

  const isMobileScreen = useMediaQuery(MutuallyExclusiveMediaQueryBreakpoints.sm)

  const modalActions: ModalAction[] = useMemo(
    () => [
      {
        label: didCopy ? 'Copied' : 'Copy',
        type: 'primary',
        onClick: copy,
        mobileSlot: 'left',
      },
      {
        label: 'Done',
        type: 'cancel',
        onClick: closeDialog,
        mobileSlot: 'right',
        hidden: !isMobileScreen,
      },
    ],
    [closeDialog, copy, didCopy, isMobileScreen],
  )

  return (
    <Modal title="Markdown Preview" close={closeDialog} actions={modalActions}>
      <div className="relative w-full px-4 py-4">
        <ErrorBoundary>
          <BlocksEditorComposer readonly initialValue={note.text}>
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
