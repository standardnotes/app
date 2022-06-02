import { WebApplication } from '@/Application/Application'
import { ViewControllerManager } from '@/Services/ViewControllerManager'
import { SortableItem } from '@standardnotes/snjs'
import { ListableContentItem } from './ListableContentItem'

export type AbstractListItemProps = {
  application: WebApplication
  viewControllerManager: ViewControllerManager
  hideDate: boolean
  hideIcon: boolean
  hideTags: boolean
  hidePreview: boolean
  item: ListableContentItem
  selected: boolean
  sortBy: keyof SortableItem | undefined
}
