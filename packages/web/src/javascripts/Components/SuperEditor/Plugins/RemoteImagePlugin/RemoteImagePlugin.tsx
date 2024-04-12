import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $insertNodes, $isRootOrShadowRoot, COMMAND_PRIORITY_NORMAL } from 'lexical'
import { useCallback, useEffect, useState } from 'react'
import { INSERT_REMOTE_IMAGE_COMMAND } from '../Commands'
import { $createRemoteImageNode, RemoteImageNode } from './RemoteImageNode'
import { mergeRegister, $wrapNodeInElement } from '@lexical/utils'
import DecoratedInput from '@/Components/Input/DecoratedInput'
import Button from '@/Components/Button/Button'
import { isMobileScreen } from '../../../../Utils'

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

  const focusOnMount = useCallback((element: HTMLInputElement | null) => {
    if (element) {
      setTimeout(() => element.focus())
    }
  }, [])

  return (
    <>
      <label className="flex flex-col gap-1.5">
        URL:
        <DecoratedInput value={url} onChange={setURL} ref={focusOnMount} />
      </label>
      <div className="mt-2.5 flex justify-end">
        <Button onClick={onClick} disabled={!url} small={isMobileScreen()}>
          Confirm
        </Button>
      </div>
    </>
  )
}

export default function RemoteImagePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand<string>(
        INSERT_REMOTE_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createRemoteImageNode(payload)
          $insertNodes([imageNode])
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd()
          }
          const newLineNode = $createParagraphNode()
          imageNode.getParentOrThrow().insertAfter(newLineNode)

          return true
        },
        COMMAND_PRIORITY_NORMAL,
      ),
      editor.registerNodeTransform(RemoteImageNode, (node) => {
        /**
         * When adding the node we wrap it with a paragraph to avoid insertion errors,
         * however that causes issues with selection. We unwrap the node to fix that.
         */
        const parent = node.getParent()
        if (!parent) {
          return
        }
        if (parent.getChildrenSize() === 1) {
          parent.insertBefore(node)
          parent.remove()
        }
      }),
    )
  }, [editor])

  return null
}
