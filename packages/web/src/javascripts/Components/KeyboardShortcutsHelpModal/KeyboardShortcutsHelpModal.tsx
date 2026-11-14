import { useCallback, useEffect, useMemo, useState } from 'react'
import { c } from 'ttag'
import Modal, { ModalAction } from '../Modal/Modal'
import ModalOverlay from '../Modal/ModalOverlay'
import {
  KeyboardCommand,
  KeyboardService,
  KeyboardShortcutBinding,
  KeyboardShortcutCategory,
  KeyboardShortcutHelpItem,
  TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
  isKeyboardCommandCustomizable,
  isMobilePlatform,
  keyboardCommandId,
  keyboardShortcutBindingsEqual,
} from '@standardnotes/ui-services'
import { PrefDefaults, PrefKey } from '@standardnotes/snjs'
import { observer } from 'mobx-react-lite'
import {
  KEYBOARD_SHORTCUT_CATEGORY_ORDER,
  translateKeyboardShortcutCategory,
} from '@/Utils/KeyboardShortcutCategoryLabels'
import { useApplication } from '../ApplicationProvider'
import KeyboardShortcutItem, { isBound } from './KeyboardShortcutItem'
import { useKeyboardShortcutRecorder } from './useKeyboardShortcutRecorder'

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

const KeyboardShortcutsModal = ({ keyboardService }: { keyboardService: KeyboardService }) => {
  const application = useApplication()

  const getOverrides = useCallback(
    () => application.getPreference(PrefKey.KeyboardShortcutOverrides, PrefDefaults[PrefKey.KeyboardShortcutOverrides]),
    [application],
  )

  const getItems = useCallback(
    () => keyboardService.getRegisteredKeyboardShorcutHelpItems({ includeUnbound: true }),
    [keyboardService],
  )

  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState(getItems)
  const [overrides, setOverrides] = useState(getOverrides)

  const refresh = useCallback(() => {
    setItems(getItems())
    setOverrides(getOverrides())
  }, [getItems, getOverrides])

  /**
   * @param binding A new binding, or `null` to unbind the command.
   * Setting a command back to its default binding removes its override.
   */
  const updateOverride = useCallback(
    (command: KeyboardCommand, binding: KeyboardShortcutBinding | null) => {
      const { [keyboardCommandId(command)]: _previous, ...next } = getOverrides()
      const defaultBinding = keyboardService.defaultKeyboardShortcutForCommand(command)
      const isDefault = binding && defaultBinding && keyboardShortcutBindingsEqual(binding, defaultBinding)
      if (!isDefault) {
        next[keyboardCommandId(command)] = binding
      }
      void application.setPreference(PrefKey.KeyboardShortcutOverrides, next)
    },
    [application, getOverrides, keyboardService],
  )

  const { recordingCommand, recordingHint, startRecording, stopRecording } = useKeyboardShortcutRecorder(
    keyboardService,
    updateOverride,
  )

  const close = useCallback(() => {
    stopRecording()
    setIsOpen(false)
  }, [stopRecording])

  useEffect(() => {
    return keyboardService.addCommandHandler({
      command: TOGGLE_KEYBOARD_SHORTCUTS_MODAL,
      category: 'General',
      description: c('B2.NavSharedUI.Action').t`Toggle keyboard shortcuts help`,
      onKeyDown: () => {
        refresh()
        setIsOpen((open) => !open)
      },
    })
  }, [keyboardService, refresh])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    return keyboardService.addShortcutChangeObserver(refresh)
  }, [isOpen, keyboardService, refresh])

  const groupedItems = useMemo(() => createGroupedItems(items), [items])

  const isOverridden = useCallback(
    (command: KeyboardCommand | undefined) => !!command && keyboardCommandId(command) in overrides,
    [overrides],
  )

  const conflictsForItem = useCallback(
    (item: KeyboardShortcutHelpItem): string[] => {
      if (!item.command || !isBound(item)) {
        return []
      }
      return items
        .filter(
          (other) =>
            other.command !== item.command &&
            isBound(other) &&
            // Some defaults intentionally share keys (e.g. search in different editors), so only flag user-made overlaps.
            (isOverridden(item.command) || isOverridden(other.command)) &&
            keyboardShortcutBindingsEqual(item, other),
        )
        .map((other) => other.description)
    },
    [items, isOverridden],
  )

  const hasOverrides = Object.keys(overrides).length > 0

  const actions = useMemo(
    (): ModalAction[] => [
      {
        label: c('B2.NavSharedUI.Action').t`Cancel`,
        onClick: close,
        type: 'cancel',
        mobileSlot: 'left',
      },
      {
        label: c('B2.NavSharedUI.Action').t`Reset all to defaults`,
        onClick: () => {
          stopRecording()
          void application.setPreference(PrefKey.KeyboardShortcutOverrides, {})
        },
        type: 'secondary',
        hidden: !hasOverrides,
      },
    ],
    [close, stopRecording, application, hasOverrides],
  )

  return (
    <ModalOverlay isOpen={isOpen} close={close}>
      <Modal title={c('B2.NavSharedUI.Title').t`Keyboard shortcuts`} close={close} actions={actions}>
        {KEYBOARD_SHORTCUT_CATEGORY_ORDER.map((category) => {
          const categoryItems = groupedItems[category]
          if (categoryItems.length === 0) {
            return null
          }

          return (
            <div key={category}>
              <div className="p-4 pb-0.5 pt-4 text-base font-semibold capitalize">
                {translateKeyboardShortcutCategory(category)}
              </div>
              {categoryItems.map((item) => {
                const command = item.command
                const editable = !!command && isKeyboardCommandCustomizable(command) && !isMobilePlatform(item.platform)
                const isRecording = !!command && command === recordingCommand

                return (
                  <KeyboardShortcutItem
                    item={item}
                    key={item.id}
                    editable={editable}
                    isRecording={isRecording}
                    recordingHint={recordingHint}
                    conflicts={conflictsForItem(item)}
                    onToggleRecording={() => (isRecording || !command ? stopRecording() : startRecording(command))}
                    onUnbind={() => {
                      stopRecording()
                      if (command) {
                        updateOverride(command, null)
                      }
                    }}
                  />
                )
              })}
            </div>
          )
        })}
      </Modal>
    </ModalOverlay>
  )
}

export default observer(KeyboardShortcutsModal)
