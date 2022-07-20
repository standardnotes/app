import { IconType, FileItem } from '@standardnotes/snjs'
import { Dispatch, SetStateAction } from 'react'
import { PopoverFileItemAction } from './PopoverFileItemAction'

type CommonProps = {
  file: FileItem
  isAttachedToNote: boolean
  handleFileAction: (action: PopoverFileItemAction) => Promise<{
    didHandleAction: boolean
  }>
  previewHandler: (file: FileItem) => void
}

export type PopoverFileItemProps = CommonProps & {
  getIconType(type: string): IconType
}

export type PopoverFileSubmenuProps = CommonProps & {
  setIsRenamingFile: Dispatch<SetStateAction<boolean>>
}
