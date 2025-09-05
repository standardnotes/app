import { observer } from 'mobx-react-lite'
import { startTransition, useCallback, useEffect, useState } from 'react'
import { useKeyboardService } from '../KeyboardServiceProvider'
import { PlatformedKeyboardShortcut, TOGGLE_COMMAND_PALETTE } from '@standardnotes/ui-services'
import {
  Combobox,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxItem,
  ComboboxList,
  ComboboxProvider,
  Dialog,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
  useDialogStore,
  useTabContext,
} from '@ariakit/react'
import {
  classNames,
  DecryptedItemInterface,
  FileItem,
  SmartView,
  SNNote,
  SNTag,
  UuidGenerator,
} from '@standardnotes/snjs'
import { KeyboardShortcutIndicator } from '../KeyboardShortcutIndicator/KeyboardShortcutIndicator'
import { useApplication } from '../ApplicationProvider'
import Icon from '../Icon/Icon'
import { getIconForItem } from '../../Utils/Items/Icons/getIconForItem'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import type { CommandService } from './CommandService'

type CommandPaletteItem = {
  id: string
  description: string
  icon: JSX.Element
  shortcut?: PlatformedKeyboardShortcut
  resultRange?: [number, number]
} & ({ section: 'notes' | 'files' | 'tags'; itemUuid: string } | { section: 'commands' })

function ListItemDescription({ item }: { item: CommandPaletteItem }) {
  const range = item.resultRange
  if (!range) {
    return item.description
  }
  return (
    <>
      {item.description.slice(0, range[0])}
      <span className="rounded-sm bg-[color-mix(in_srgb,var(--sn-stylekit-accessory-tint-color-1),rgba(255,255,255,.1))] p-px">
        {item.description.slice(range[0], range[1])}
      </span>
      {item.description.slice(range[1])}
    </>
  )
}

const Tabs = ['all', 'commands', 'notes', 'files', 'tags'] as const
type TabId = (typeof Tabs)[number]

function CommandPaletteListItem({
  item,
  index,
  handleClick,
  selectedTab,
}: {
  item: CommandPaletteItem
  index: number
  handleClick: (item: CommandPaletteItem) => void
  selectedTab: TabId
}) {
  if (selectedTab !== 'all' && selectedTab !== item.section) {
    return null
  }
  return (
    <ComboboxItem
      id={item.id}
      value={item.id}
      hideOnClick={true}
      focusOnHover={true}
      blurOnHoverEnd={false}
      className={classNames(
        'flex scroll-m-2 items-center gap-2 whitespace-nowrap rounded-md px-2 py-2.5 text-[0.95rem] data-[active-item]:bg-info data-[active-item]:text-info-contrast [&>svg]:flex-shrink-0',
        index === 0 && 'scroll-m-8',
      )}
      onClick={() => handleClick(item)}
    >
      {item.icon}
      <div className="mr-auto overflow-hidden text-ellipsis whitespace-nowrap leading-none">
        <ListItemDescription item={item} />
      </div>
      {item.shortcut && <KeyboardShortcutIndicator className="ml-auto" shortcut={item.shortcut} small={false} />}
    </ComboboxItem>
  )
}

function ComboboxInput() {
  const tab = useTabContext()
  return (
    <Combobox
      autoSelect="always"
      className="h-10 w-full appearance-none bg-transparent px-1 text-base focus:shadow-none focus:outline-none"
      placeholder="Search notes, files, commands, etc..."
      onKeyDown={(event) => {
        if (event.key !== 'Tab') {
          return
        }
        const activeId = tab?.getState().selectedId
        const options = { activeId }
        const nextId = event.shiftKey ? tab?.previous(options) : tab?.next(options)
        if (nextId) {
          event.preventDefault()
          tab?.select(nextId)
        }
      }}
    />
  )
}

// Future TODO, nice to have: A way to expose items like the current note's options
// directly in the command palette rather than only having a way to open the menu
function CommandPalette() {
  const application = useApplication()
  const keyboardService = useKeyboardService()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recents, setRecents] = useState<CommandPaletteItem[]>([])
  const [items, setItems] = useState<CommandPaletteItem[]>([])
  // Storing counts as separate state to avoid iterating items multiple times
  const [itemCountsPerTab, setItemCounts] = useState({
    commands: 0,
    notes: 0,
    files: 0,
    tags: 0,
  })
  const [selectedTab, setSelectedTab] = useState<TabId>('all')
  const dialog = useDialogStore({
    open: isOpen,
    setOpen: setIsOpen,
  })

  useEffect(() => {
    if (isOpen) {
      keyboardService.disableEventHandling()
    } else {
      keyboardService.enableEventHandling()
    }
  }, [keyboardService, isOpen])

  useEffect(() => {
    return keyboardService.addCommandHandler({
      command: TOGGLE_COMMAND_PALETTE,
      category: 'General',
      description: 'Toggle command palette',
      onKeyDown: (e) => {
        e.preventDefault()
        setIsOpen((open) => !open)
        setQuery('')
      },
    })
  }, [keyboardService])

  const handleItemClick = useCallback(
    (item: CommandPaletteItem) => {
      if (item.section === 'commands') {
        application.commands.triggerCommand(item.id)
        application.recents.add(item.id, 'command')
      } else {
        const decryptedItem = application.items.findItem<DecryptedItemInterface>(item.itemUuid)
        if (!decryptedItem) {
          return
        }
        if (decryptedItem instanceof SNNote) {
          void application.itemListController.selectItemUsingInstance(decryptedItem, true)
        } else if (decryptedItem instanceof FileItem) {
          void application.filesController.handleFileAction({
            type: FileItemActionType.PreviewFile,
            payload: { file: decryptedItem },
          })
        } else if (decryptedItem instanceof SNTag || decryptedItem instanceof SmartView) {
          void application.navigationController.setSelectedTag(decryptedItem, 'all', {
            userTriggered: true,
          })
        }
      }
    },
    [
      application.commands,
      application.filesController,
      application.itemListController,
      application.items,
      application.navigationController,
      application.recents,
    ],
  )

  const createItemForInteractableItem = useCallback(
    (item: DecryptedItemInterface): CommandPaletteItem => {
      const icon = getIconForItem(item, application)
      let section: 'notes' | 'files' | 'tags'
      if (item instanceof SNNote) {
        section = 'notes'
      } else if (item instanceof FileItem) {
        section = 'files'
      } else if (item instanceof SNTag || item instanceof SmartView) {
        section = 'tags'
      } else {
        throw new Error('Item is not a note, file or tag')
      }
      return {
        section,
        id: UuidGenerator.GenerateUuid(),
        itemUuid: item.uuid,
        description: item.title || '<no title>',
        icon: <Icon type={icon[0]} className={item instanceof SNNote ? icon[1] : ''} />,
      }
    },
    [application],
  )

  const createItemForCommand = useCallback(
    (command: ReturnType<CommandService['getCommandDescriptions']>[0]): CommandPaletteItem => {
      const shortcut = command.shortcut_id
        ? application.keyboardService.keyboardShortcutForCommand(command.shortcut_id)
        : undefined
      return {
        id: command.id,
        description: command.description,
        section: 'commands',
        icon: <Icon type={command.icon} />,
        shortcut,
      }
    },
    [application.keyboardService],
  )

  useEffect(
    function updateCommandPaletteItems() {
      if (!isOpen) {
        setSelectedTab('all')
        setItems([])
        return
      }

      const recents: CommandPaletteItem[] = []
      const items: CommandPaletteItem[] = []
      const itemCounts: typeof itemCountsPerTab = {
        commands: 0,
        notes: 0,
        files: 0,
        tags: 0,
      }

      const searchQuery = query.toLowerCase()
      const hasQuery = searchQuery.length > 0

      if (hasQuery) {
        const commands = application.commands.getCommandDescriptions()
        for (let i = 0; i < commands.length; i++) {
          const command = commands[i]
          if (!command) {
            continue
          }
          if (items.length >= 50) {
            break
          }
          const index = command.description.toLowerCase().indexOf(searchQuery)
          if (index === -1) {
            continue
          }
          const item = createItemForCommand(command)
          item.resultRange = [index, index + searchQuery.length]
          items.push(item)
          itemCounts[item.section]++
        }

        const interactableItems = application.items.getInteractableItems()
        for (let i = 0; i < interactableItems.length; i++) {
          if (items.length >= 50) {
            break
          }
          const decryptedItem = interactableItems[i]
          if (!decryptedItem || !decryptedItem.title) {
            continue
          }
          const index = decryptedItem.title.toLowerCase().indexOf(searchQuery)
          if (index === -1) {
            continue
          }
          const item = createItemForInteractableItem(decryptedItem)
          item.resultRange = [index, index + searchQuery.length]
          items.push(item)
          itemCounts[item.section]++
        }
      } else {
        const recentCommands = application.recents.commandUuids
        for (let i = 0; i < recentCommands.length; i++) {
          const command = application.commands.getCommandDescription(recentCommands[i])
          if (!command) {
            continue
          }
          const item = createItemForCommand(command)
          recents.push(item)
          itemCounts[item.section]++
        }
        const recentItems = application.recents.itemUuids
        for (let i = 0; i < recentItems.length; i++) {
          const decryptedItem = application.items.findItem(recentItems[i])
          if (!decryptedItem) {
            continue
          }
          const item = createItemForInteractableItem(decryptedItem)
          recents.push(item)
          itemCounts[item.section]++
        }

        const commands = application.commands.getCommandDescriptions()
        for (let i = 0; i < commands.length; i++) {
          const command = commands[i]
          if (!command || recentCommands.includes(command.id)) {
            continue
          }
          const item = createItemForCommand(command)
          items.push(item)
          itemCounts[item.section]++
        }
        items.sort((a, b) => (a.description.toLowerCase() < b.description.toLowerCase() ? -1 : 1))
      }

      setItems(items)
      setRecents(recents)
      setItemCounts(itemCounts)
    },
    [application, createItemForCommand, createItemForInteractableItem, isOpen, query],
  )

  const hasNoItemsAtAll = items.length === 0
  const hasNoItemsInSelectedTab = selectedTab !== 'all' && itemCountsPerTab[selectedTab] === 0

  return (
    <Dialog
      store={dialog}
      className="fixed inset-3 bottom-[10vh] top-[10vh] z-modal m-auto mt-0 flex h-fit max-h-[70vh] w-[min(45rem,90vw)] flex-col gap-3 overflow-auto rounded-xl border border-[--popover-border-color] bg-[--popover-background-color] px-3 py-3 shadow-main [backdrop-filter:var(--popover-backdrop-filter)]"
      backdrop={<div className="bg-passive-5 opacity-50 transition-opacity duration-75 data-[enter]:opacity-85" />}
    >
      <ComboboxProvider
        disclosure={dialog}
        includesBaseElement={false}
        resetValueOnHide={true}
        setValue={(value) => {
          startTransition(() => setQuery(value))
        }}
      >
        <TabProvider selectedId={selectedTab} setSelectedId={(id) => setSelectedTab((id as TabId) || 'all')}>
          <div className="flex rounded-lg border border-[--popover-border-color] bg-[--popover-background-color] px-2">
            <ComboboxInput />
          </div>
          <TabList className="flex items-center gap-1">
            {Tabs.map((id) => (
              <Tab
                key={id}
                id={id}
                className="rounded-full px-3 py-1 capitalize disabled:opacity-65 aria-selected:bg-info aria-selected:text-info-contrast data-[active-item]:ring-1 data-[active-item]:ring-info data-[active-item]:ring-offset-1 data-[active-item]:ring-offset-transparent"
                disabled={hasNoItemsAtAll || (id !== 'all' && itemCountsPerTab[id] === 0)}
                accessibleWhenDisabled={false}
              >
                {id}
              </Tab>
            ))}
          </TabList>
          <TabPanel className="flex flex-col gap-1.5 overflow-y-auto" tabId={selectedTab}>
            {query.length > 0 && (hasNoItemsAtAll || hasNoItemsInSelectedTab) && (
              <div className="mx-auto px-2 text-sm font-semibold opacity-75">No items found</div>
            )}
            <ComboboxList className="focus:shadow-none focus:outline-none">
              {recents.length > 0 && (
                <ComboboxGroup>
                  <ComboboxGroupLabel className="px-2 font-semibold opacity-75">Recents:</ComboboxGroupLabel>
                  {recents.map((item, index) => (
                    <CommandPaletteListItem
                      key={item.id}
                      index={index}
                      item={item}
                      handleClick={handleItemClick}
                      selectedTab={selectedTab}
                    />
                  ))}
                </ComboboxGroup>
              )}
              {!hasNoItemsAtAll && (
                <ComboboxGroup>
                  {recents.length > 0 && (
                    <ComboboxGroupLabel className="mt-2 px-2 font-semibold opacity-75">Commands:</ComboboxGroupLabel>
                  )}
                  {items.map((item, index) => (
                    <CommandPaletteListItem
                      key={item.id}
                      index={index}
                      item={item}
                      handleClick={handleItemClick}
                      selectedTab={selectedTab}
                    />
                  ))}
                </ComboboxGroup>
              )}
            </ComboboxList>
          </TabPanel>
        </TabProvider>
      </ComboboxProvider>
    </Dialog>
  )
}

export default observer(CommandPalette)
