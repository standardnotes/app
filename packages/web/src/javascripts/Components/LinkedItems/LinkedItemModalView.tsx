import { observer } from 'mobx-react-lite'
import Modal from '../Modal/Modal'
import Icon from '../Icon/Icon'
import ModalOverlay from '../Modal/ModalOverlay'
import { ItemLink } from '@/Utils/Items/Search/ItemLink'
import { LinkableItem } from '@/Utils/Items/Search/LinkableItem'
import LinkedItemMeta from './LinkedItemMeta'

type Props = {
  items: ItemLink[]
  readonly?: boolean
  isOpen: boolean
  onClose: () => void
  onUnlink: (item: LinkableItem) => void
  onActivate: (item: LinkableItem) => Promise<void>
}

const LinkedItemModalView = ({ items, readonly, isOpen, onClose, onUnlink, onActivate }: Props) => {
  return (
    <ModalOverlay isOpen={isOpen} close={onClose}>
      <Modal
        title="All linked items"
        close={onClose}
        actions={[
          {
            label: 'Done',
            onClick: onClose,
            type: 'primary',
            mobileSlot: 'right'
          }
        ]}
      >
        <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
          <div className="flex flex-col gap-2">
            {items.map((link) => (
              <div key={link.id} className="flex items-center justify-between gap-4 rounded bg-passive-4-opacity-variant p-2">
                <button
                  className="flex flex-grow items-center gap-2"
                  onClick={() => onActivate(link.item)}
                >
                  <LinkedItemMeta item={link.item} />
                </button>
                {!readonly && (
                  <button
                    className="rounded-full p-1 hover:bg-contrast"
                    onClick={() => onUnlink(link.item)}
                  >
                    <Icon type="link-off" className="text-danger" size="small" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </ModalOverlay>
  )
}

export default observer(LinkedItemModalView)