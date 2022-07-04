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
