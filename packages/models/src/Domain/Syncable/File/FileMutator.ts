import { ContentType } from '@standardnotes/common'
import { SNNote } from '../Note/Note'
import { FileContent } from './File'
import { FileToNoteReference } from '../../Abstract/Reference/FileToNoteReference'
import { ContenteReferenceType } from '../../Abstract/Reference/ContenteReferenceType'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'

export class FileMutator extends DecryptedItemMutator<FileContent> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  set encryptionHeader(encryptionHeader: string) {
    this.mutableContent.encryptionHeader = encryptionHeader
  }

  public addNote(note: SNNote): void {
    const reference: FileToNoteReference = {
      reference_type: ContenteReferenceType.FileToNote,
      content_type: ContentType.Note,
      uuid: note.uuid,
    }

    const references = this.mutableContent.references || []
    references.push(reference)
    this.mutableContent.references = references
  }

  public removeNote(note: SNNote): void {
    const references = this.immutableItem.references.filter((ref) => ref.uuid !== note.uuid)
    this.mutableContent.references = references
  }
}
