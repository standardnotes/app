import { SNNote, FileItem } from '@standardnotes/models'

export interface ItemViewControllerInterface {
  item: SNNote | FileItem

  deinit: () => void
  initialize(addTagHierarchy?: boolean): Promise<void>
}
