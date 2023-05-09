export type DesktopWatchedDirectoriesChange = {
  itemUuid: string
  path: string
  type: 'rename' | 'change'
  content: string
}

export type DesktopWatchedDirectoriesChanges = DesktopWatchedDirectoriesChange[]
