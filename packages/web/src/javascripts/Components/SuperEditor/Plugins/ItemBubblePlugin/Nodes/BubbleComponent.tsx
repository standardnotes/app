import { useCallback, useMemo } from 'react'
import { useApplication } from '@/Components/ApplicationProvider'
import LinkedItemBubble from '@/Components/LinkedItems/LinkedItemBubble'
import { createLinkFromItem } from '@/Utils/Items/Search/createLinkFromItem'
import { useLinkingController } from '@/Controllers/LinkingControllerProvider'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import { useResponsiveAppPane } from '@/Components/Panes/ResponsivePaneProvider'
import { LexicalNode } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export type BubbleComponentProps = Readonly<{
  itemUuid: string
  node: LexicalNode
}>

export function BubbleComponent({ itemUuid, node }: BubbleComponentProps) {
  const application = useApplication()
  const [editor] = useLexicalComposerContext()
  const linkingController = useLinkingController()
  const item = useMemo(() => application.items.findItem(itemUuid), [application, itemUuid])
  const { toggleAppPane } = useResponsiveAppPane()

  const activateItemAndTogglePane = useCallback(
    async (item: LinkableItem) => {
      const paneId = await linkingController.activateItem(item)
      if (paneId) {
        toggleAppPane(paneId)
      }
    },
    [toggleAppPane, linkingController],
  )

  const unlinkPressed = useCallback(
    async (itemToUnlink: LinkableItem) => {
      linkingController.unlinkItemFromSelectedItem(itemToUnlink).catch(console.error)
      editor.update(() => {
        node.remove()
      })
    },
    [linkingController, node, editor],
  )

  if (!item) {
    return <div>Unable to find item {itemUuid}</div>
  }

  const link = createLinkFromItem(item, 'linked')

  return (
    <LinkedItemBubble
      className="mx-0.5"
      link={link}
      key={link.id}
      activateItem={activateItemAndTogglePane}
      unlinkItem={unlinkPressed}
      isBidirectional={false}
      inlineFlex={true}
      wrappable
    />
  )
}
