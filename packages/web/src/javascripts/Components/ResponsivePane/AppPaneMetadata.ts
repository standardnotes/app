import { ElementIds } from '@/Constants/ElementIDs'

export enum AppPaneId {
  Navigation = 'NavigationColumn',
  Items = 'ItemsColumn',
  Editor = 'EditorColumn',
}

export const AppPaneIdToDivId = {
  [AppPaneId.Navigation]: ElementIds.NavigationColumn,
  [AppPaneId.Items]: ElementIds.ItemsColumn,
  [AppPaneId.Editor]: ElementIds.EditorColumn,
}
