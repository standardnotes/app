import { IconType } from '@standardnotes/snjs'

export enum AppPaneId {
  Navigation = 'NavigationColumn',
  Items = 'ItemsColumn',
  Editor = 'EditorColumn',
}

export const AppPaneTitles = {
  [AppPaneId.Navigation]: 'Navigation',
  [AppPaneId.Items]: 'Notes & Files',
  [AppPaneId.Editor]: 'Editor',
}

export const AppPaneIcons: Record<AppPaneId, IconType> = {
  [AppPaneId.Navigation]: 'hashtag',
  [AppPaneId.Items]: 'notes',
  [AppPaneId.Editor]: 'plain-text',
}
