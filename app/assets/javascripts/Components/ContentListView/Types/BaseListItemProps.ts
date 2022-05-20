import { WebApplication } from '@/UIModels/Application'
import { AppState } from '@/UIModels/AppState'
import { SortableItem } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

export type BaseListItemProps = {
  application: WebApplication
  appState: AppState
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
}
