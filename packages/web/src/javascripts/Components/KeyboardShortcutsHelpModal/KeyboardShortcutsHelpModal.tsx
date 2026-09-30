import { useCallback, useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'
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
import {
  KEYBOARD_SHORTCUT_CATEGORY_ORDER,
  translateKeyboardShortcutCategory,
} from '@/Utils/KeyboardShortcutCategoryLabels'

type GroupedItems = Record<KeyboardShortcutCategory, KeyboardShortcutHelpItem[]>

const createEmptyGroupedItems = (): GroupedItems =>
  Object.fromEntries(
    KEYBOARD_SHORTCUT_CATEGORY_ORDER.map((category) => [category, [] as KeyboardShortcutHelpItem[]]),
  ) as GroupedItems

const createGroupedItems = (items: KeyboardShortcutHelpItem[]): GroupedItems => {
  const groupedItems = createEmptyGroupedItems()

  for (const item of items) {
    groupedItems[item.category].push(item)
  }

  return groupedItems
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
        {KEYBOARD_SHORTCUT_CATEGORY_ORDER.map((category) => {
          const categoryItems = items[category]
          if (categoryItems.length === 0) {
            return null
          }

          return (
            <div key={category}>
              <div className="p-4 pb-0.5 pt-4 text-base font-semibold capitalize">
                {translateKeyboardShortcutCategory(category)}
              </div>
              {categoryItems.map((item, index) => (
                <Item item={item} key={index} />
              ))}
            </div>
          )
        })}
      </Modal>
    </ModalOverlay>
  )
}

export default observer(KeyboardShortcutsModal)
