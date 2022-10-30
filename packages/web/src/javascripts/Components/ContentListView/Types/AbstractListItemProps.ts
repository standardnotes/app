import { WebApplication } from '@/Application/Application'
import { FilesController } from '@/Controllers/FilesController'
import { NotesController } from '@/Controllers/NotesController'
import { SortableItem, SNTag, Uuids } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

export type AbstractListItemProps = {
  application: WebApplication
  filesController: FilesController
  notesController: NotesController
  onSelect: (item: ListableContentItem, userTriggered?: boolean) => Promise<{ didSelect: boolean }>
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
  tags: SNTag[]
}

export function doListItemPropsMeritRerender(previous: AbstractListItemProps, next: AbstractListItemProps): boolean {
  const simpleComparison: (keyof AbstractListItemProps)[] = [
    'onSelect',
    'hideDate',
    'hideIcon',
    'hideTags',
    'hidePreview',
    'selected',
    'sortBy',
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

  const propertiesMeritingRerender: (keyof ListableContentItem)[] = [
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
    if (previous[key] !== next[key]) {
      return true
    }
  }

  return false
}
