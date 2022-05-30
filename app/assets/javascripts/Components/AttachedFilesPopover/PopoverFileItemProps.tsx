import { IconType, FileItem } from '@standardnotes/snjs'
import { PopoverFileItemAction } from './PopoverFileItemAction'

export type PopoverFileItemProps = {
  file: FileItem
  isAttachedToNote: boolean
  handleFileAction: (action: PopoverFileItemAction) => Promise<boolean>
  getIconType(type: string): IconType
  closeOnBlur: (event: { relatedTarget: EventTarget | null }) => void
}
