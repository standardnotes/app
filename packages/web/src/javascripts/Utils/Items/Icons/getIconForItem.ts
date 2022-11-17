import { IconType, FileItem, SNNote, DecryptedItem, SNTag, WebApplicationInterface } from '@standardnotes/snjs'
import { getIconAndTintForNoteType } from './getIconAndTintForNoteType'
import { getIconForFileType } from './getIconForFileType'

export function getIconForItem(item: DecryptedItem, application: WebApplicationInterface): [IconType, string] {
  if (item instanceof SNNote) {
    const editorForNote = application.componentManager.editorForNote(item)
    const [icon, tint] = getIconAndTintForNoteType(editorForNote?.package_info.note_type)
    const className = `text-accessory-tint-${tint}`
    return [icon, className]
  } else if (item instanceof FileItem) {
    const icon = getIconForFileType(item.mimeType)
    return [icon, 'text-info']
  } else if (item instanceof SNTag) {
    return [item.iconString as IconType, 'text-info']
  }

  throw new Error('Unhandled case in getItemIcon')
}
