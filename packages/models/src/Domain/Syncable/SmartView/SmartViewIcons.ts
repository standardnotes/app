import { SystemViewId } from './SystemViewId'
import { IconType } from '../../Utilities/Icon/IconType'

export const SmartViewIcons: Record<SystemViewId, IconType> = {
  [SystemViewId.AllNotes]: 'notes',
  [SystemViewId.Files]: 'folder',
  [SystemViewId.ArchivedNotes]: 'archive',
  [SystemViewId.TrashedNotes]: 'trash',
  [SystemViewId.UntaggedNotes]: 'hashtag-off',
  [SystemViewId.StarredNotes]: 'star-filled',
  [SystemViewId.Conflicts]: 'merge',
}

export function systemViewIcon(id: SystemViewId): IconType {
  return SmartViewIcons[id]
}

export const SmartViewDefaultIconName: IconType = 'restore'
