import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_NORMAL } from 'lexical'
import { useEffect, useState } from 'react'
import Button from '../../Lexical/UI/Button'
import { DialogActions } from '../../Lexical/UI/Dialog'
import TextInput from '../../Lexical/UI/TextInput'
import { INSERT_REMOTE_IMAGE_COMMAND } from '../Commands'
import { $createRemoteImageNode } from './RemoteImageNode'
import { $wrapNodeInElement } from '@lexical/utils'

export function InsertRemoteImageDialog({ onClose }: { onClose: () => void }) {
  const [url, setURL] = useState('')
  const [editor] = useLexicalComposerContext()

  const onClick = () => {
    if (url.length < 1) {
      return
    }

    editor.dispatchCommand(INSERT_REMOTE_IMAGE_COMMAND, url)
    onClose()
  }

  return (
    <>
      <TextInput label="URL:" onChange={setURL} value={url} />
      <DialogActions>
        <Button onClick={onClick}>Confirm</Button>
      </DialogActions>
    </>
  )
}

export default function RemoteImagePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand<string>(
      INSERT_REMOTE_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createRemoteImageNode(payload)
        $insertNodes([imageNode])
        if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
          $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
        }
        const newLineNode = $createParagraphNode()
        $insertNodes([newLineNode])

        return true
      },
      COMMAND_PRIORITY_NORMAL,
    )
  }, [editor])

  return null
}
