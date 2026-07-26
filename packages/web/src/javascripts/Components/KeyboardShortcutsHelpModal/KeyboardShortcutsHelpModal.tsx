import { useCallback, useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalOverlay from '../Modal/ModalOverlay'
import { KeyboardService, KeyboardShortcutHelpItem, TOGGLE_KEYBOARD_SHORTCUTS_MODAL } from '@standardnotes/ui-services'
import { observer } from 'mobx-react-lite'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'

type GroupedItems = Record<string, KeyboardShortcutHelpItem[]>

const createGroupedItems = (items: KeyboardShortcutHelpItem[]): GroupedItems => {
  const groupedItems: GroupedItems = {
    [c('B2.NavSharedUI.Label').t`Current note`]: [],
    [c('B2.NavSharedUI.Label').t`Formatting`]: [],
    [c('B2.NavSharedUI.Label').t`Super notes`]: [],
    [c('B2.NavSharedUI.Label').t`Notes list`]: [],
    [c('B2.NavSharedUI.Label').t`General` as 'General']: [],
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
      category: c('B2.NavSharedUI.Label').t`General` as 'General',
      description: c('B2.NavSharedUI.Action').t`Toggle keyboard shortcuts help`,
      onKeyDown: () => {
        setItems(createGroupedItems(keyboardService.getRegisteredKeyboardShorcutHelpItems()))
        setIsOpen((open) => !open)
      },
    })
  }, [keyboardService])

  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: c('B2.NavSharedUI.Action').t`Cancel`,
        onClick: close,
        type: 'cancel',
        mobileSlot: 'left',
      },
    ],
    [close],
  )

  return (
    <ModalOverlay isOpen={isOpen} close={close}>
      <Modal title={c('B2.NavSharedUI.Title').t`Keyboard shortcuts`} close={close} actions={actions}>
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
