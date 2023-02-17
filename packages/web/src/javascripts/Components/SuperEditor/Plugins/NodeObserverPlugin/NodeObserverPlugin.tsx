import { useEffect, useRef } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey, Klass, LexicalNode } from 'lexical'
import { ItemNodeInterface } from '../ItemNodeInterface'

type NodeKey = string
type ItemUuid = string

type ObserverProps = {
  nodeType: Klass<LexicalNode>
  onRemove: (itemUuid: string) => void
}

export function NodeObserverPlugin({ nodeType, onRemove }: ObserverProps) {
  const [editor] = useLexicalComposerContext()
  const map = useRef<Map<NodeKey, ItemUuid>>(new Map())

  useEffect(() => {
    const removeMutationListener = editor.registerMutationListener(nodeType, (mutatedNodes) => {
      editor.getEditorState().read(() => {
        for (const [nodeKey, mutation] of mutatedNodes) {
          if (mutation === 'updated' || mutation === 'created') {
            const node = $getNodeByKey(nodeKey) as unknown as ItemNodeInterface

            if (node) {
              const uuid = node.getId()
              map.current.set(nodeKey, uuid)
            }
          } else if (mutation === 'destroyed') {
            const uuid = map.current.get(nodeKey)
            if (uuid) {
              onRemove(uuid)
            }
          }
        }
      })
    })

    return () => {
      removeMutationListener()
    }
  })

  return null
}
