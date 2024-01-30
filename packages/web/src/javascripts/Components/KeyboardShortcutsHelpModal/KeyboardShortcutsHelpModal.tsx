import { useCallback, useEffect, useMemo, useState } from 'react'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalOverlay from '../Modal/ModalOverlay'
import {
  KeyboardService,
  KeyboardShortcutCategory,
  KeyboardShortcutHelpItem,
  TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
} from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'

type GroupedItems = {
  [category in KeyboardShortcutCategory]: KeyboardShortcutHelpItem[]
}

const createGroupedItems = (items: KeyboardShortcutHelpItem[]): GroupedItems => {
  const groupedItems: GroupedItems = {
    'Current note': [],
    Formatting: [],
    'Super notes': [],
    'Notes list': [],
    General: [],
  }
  return items.reduce((acc, item) => {
    acc[item.category].push(item)
    return acc
  }, groupedItems)
}

const Item = ({ item }: { item: KeyboardShortcutHelpItem }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5">
      <div>{item.description}</div>
      <KeyboardShortcutIndicator className="ml-auto" shortcut={item} small={false} dimmed={false} />
    </div>
  )
}

const KeyboardShortcutsModal = ({ keyboardService }: { keyboardService: KeyboardService }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState(() => createGroupedItems(keyboardService.getRegisteredKeyboardShorcutHelpItems()))

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  useEffect(() => {
    return keyboardService.addCommandHandler({
      command: TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
      category: 'General',
      description: 'Toggle keyboard shortcuts help',
      onKeyDown: () => {
        setItems(createGroupedItems(keyboardService.getRegisteredKeyboardShorcutHelpItems()))
        setIsOpen((open) => !open)
      },
    })
  }, [keyboardService])

  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: 'Cancel',
        onClick: close,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [close],
  )

  return (
    <ModalOverlay isOpen={isOpen} close={close}>
      <Modal title="Keyboard shortcuts" close={close} actions={actions}>
        {Object.entries(items).map(
          ([category, items]) =>
            items.length > 0 && (
              <div key={category}>
                <div className="p-4 pb-0.5 pt-4 text-base font-semibold capitalize">{category}</div>
                {items.map((item, index) => (
                  <Item item={item} key={index} />
                ))}
              </div>
            ),
        )}
      </Modal>
    </ModalOverlay>
  )
}

export default observer(KeyboardShortcutsModal)
