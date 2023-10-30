import { WebApplication } from '@/Application/WebApplication'
import { getNoteBlob, getNoteFileName } from '@/Utils/NoteExportUtils'
import { parseFileName } from '@standardnotes/filepicker'
import { PrefDefaults, PrefKey, SNNote } from '@standardnotes/snjs'
import { sanitizeFileName } from '@standardnotes/ui-services'
import { shareBlobOnMobile } from './ShareBlobOnMobile'

export const shareSelectedNotes = async (application: WebApplication, notes: SNNote[]) => {
  if (!application.isNativeMobileWeb()) {
    throw new Error('Share function being used outside mobile webview')
  }
  const superEmbedBehaviorPref = application.getPreference(
    PrefKey.SuperNoteExportEmbedBehavior,
    PrefDefaults[PrefKey.SuperNoteExportEmbedBehavior],
  )
  if (notes.length === 1) {
    const note = notes[0]
    const blob = getNoteBlob(application, note, superEmbedBehaviorPref)
    const { name, ext } = parseFileName(getNoteFileName(application, note))
    const filename = `${sanitizeFileName(name)}.${ext}`
    void shareBlobOnMobile(application.mobileDevice, application.isNativeMobileWeb(), blob, filename)
    return
  }
  if (notes.length > 1) {
    const zippedDataBlob = await application.archiveService.zipData(
      notes.map((note) => {
        return {
          name: getNoteFileName(application, note),
          content: getNoteBlob(application, note, superEmbedBehaviorPref),
        }
      }),
    )
    void shareBlobOnMobile(
      application.mobileDevice,
      application.isNativeMobileWeb(),
      zippedDataBlob,
      `Standard Notes Export - ${application.archiveService.formattedDateForExports()}.zip`,
    )
  }
}
