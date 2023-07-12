import { ContentType } from '@standardnotes/domain-core'
import { SNNote } from '../Note/Note'
import { FileContent, FileItem } from './File'
import { FileToNoteReference } from '../../Abstract/Reference/FileToNoteReference'
import { ContentReferenceType } from '../../Abstract/Reference/ContenteReferenceType'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { FileToFileReference } from '../../Abstract/Reference/FileToFileReference'

export class FileMutator extends DecryptedItemMutator<FileContent> {
  set name(newName: string) {
    this.mutableContent.name = newName
  }

  set encryptionHeader(encryptionHeader: string) {
    this.mutableContent.encryptionHeader = encryptionHeader
  }

  public addNote(note: SNNote): void {
    const reference: FileToNoteReference = {
      reference_type: ContentReferenceType.FileToNote,
      content_type: ContentType.TYPES.Note,
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

  public addFile(file: FileItem): void {
    if (this.immutableItem.isReferencingItem(file)) {
      return
    }

    const reference: FileToFileReference = {
      uuid: file.uuid,
      content_type: ContentType.TYPES.File,
      reference_type: ContentReferenceType.FileToFile,
    }

    this.mutableContent.references.push(reference)
  }

  public removeFile(file: FileItem): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== file.uuid)
  }
}
