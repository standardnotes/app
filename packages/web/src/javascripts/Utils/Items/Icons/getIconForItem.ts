import { IconType, FileItem, SNNote, SNTag, DecryptedItemInterface } from '@standardnotes/snjs'
import { getIconAndTintForNoteType } from './getIconAndTintForNoteType'
import { getIconForFileType } from './getIconForFileType'
import { WebApplicationInterface } from '@standardnotes/ui-services'

export function getIconForItem(item: DecryptedItemInterface, application: WebApplicationInterface): [IconType, string] {
  if (item instanceof SNNote) {
    const editorForNote = application.componentManager.editorForNote(item)
    const [icon, tint] = getIconAndTintForNoteType(editorForNote.noteType)
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
