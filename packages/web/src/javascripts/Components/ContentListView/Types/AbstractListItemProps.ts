import { WebApplication } from '@/Application/WebApplication'
import { FilesController } from '@/Controllers/FilesController'
import { NotesController } from '@/Controllers/NotesController/NotesController'
import { SortableItem, SNTag, Uuids } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

type KeysOfUnion<T> = T extends T ? keyof T : never

export type AbstractListItemProps<I extends ListableContentItem> = {
  application: WebApplication
  filesController: FilesController
  notesController: NotesController
  onSelect: (item: ListableContentItem, userTriggered?: boolean) => Promise<{ didSelect: boolean }>
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: I
  selected: boolean
  sortBy: keyof SortableItem | undefined
  tags: SNTag[]
  isPreviousItemTiled?: boolean
  isNextItemTiled?: boolean
}

export function doListItemPropsMeritRerender(
  previous: AbstractListItemProps<ListableContentItem>,
  next: AbstractListItemProps<ListableContentItem>,
): boolean {
  const simpleComparison: (keyof AbstractListItemProps<ListableContentItem>)[] = [
    'onSelect',
    'hideDate',
    'hideIcon',
    'hideTags',
    'hidePreview',
    'selected',
    'sortBy',
    'isPreviousItemTiled',
    'isNextItemTiled',
  ]

  for (const key of simpleComparison) {
    if (previous[key] !== next[key]) {
      return true
    }
  }

  if (previous['item'] !== next['item']) {
    if (doesItemChangeMeritRerender(previous['item'], next['item'])) {
      return true
    }
  }

  return doesTagsChangeMeritRerender(previous['tags'], next['tags'])
}

function doesTagsChangeMeritRerender(previous: SNTag[], next: SNTag[]): boolean {
  if (previous === next) {
    return false
  }

  if (previous.length !== next.length) {
    return true
  }

  if (previous.length === 0 && next.length === 0) {
    return false
  }

  if (Uuids(previous).sort().join() !== Uuids(next).sort().join()) {
    return true
  }

  if (
    previous
      .map((t) => t.title)
      .sort()
      .join() !==
    next
      .map((t) => t.title)
      .sort()
      .join()
  ) {
    return true
  }

  return false
}

function doesItemChangeMeritRerender(previous: ListableContentItem, next: ListableContentItem): boolean {
  if (previous.uuid !== next.uuid) {
    return true
  }

  const propertiesMeritingRerender: KeysOfUnion<ListableContentItem>[] = [
    'title',
    'protected',
    'updatedAtString',
    'createdAtString',
    'hidePreview',
    'preview_html',
    'preview_plain',
    'archived',
    'starred',
    'pinned',
  ]

  for (const key of propertiesMeritingRerender) {
    if (previous[key as keyof ListableContentItem] !== next[key as keyof ListableContentItem]) {
      return true
    }
  }

  return false
}
