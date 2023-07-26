import { NoteContent } from './NoteContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { SNNote } from './Note'
import { NoteToNoteReference } from '../../Abstract/Reference/NoteToNoteReference'
import { ContentReferenceType } from '../../Abstract/Item'
import { NoteType } from '@standardnotes/features'
import { EditorLineWidth } from '../UserPrefs'
import { ContentType } from '@standardnotes/domain-core'

export class NoteMutator extends DecryptedItemMutator<NoteContent> {
  set title(title: string) {
    this.mutableContent.title = title
  }

  set text(text: string) {
    this.mutableContent.text = text
  }

  set hidePreview(hidePreview: boolean) {
    this.mutableContent.hidePreview = hidePreview
  }

  set preview_plain(preview_plain: string) {
    this.mutableContent.preview_plain = preview_plain
  }

  set preview_html(preview_html: string | undefined) {
    this.mutableContent.preview_html = preview_html
  }

  set spellcheck(spellcheck: boolean) {
    this.mutableContent.spellcheck = spellcheck
  }

  set editorWidth(editorWidth: EditorLineWidth) {
    this.mutableContent.editorWidth = editorWidth
  }

  set noteType(noteType: NoteType) {
    this.mutableContent.noteType = noteType
  }

  set editorIdentifier(identifier: string | undefined) {
    this.mutableContent.editorIdentifier = identifier
  }

  set authorizedForListed(authorizedForListed: boolean) {
    this.mutableContent.authorizedForListed = authorizedForListed
  }

  toggleSpellcheck(): void {
    if (this.mutableContent.spellcheck == undefined) {
      this.mutableContent.spellcheck = false
    } else {
      this.mutableContent.spellcheck = !this.mutableContent.spellcheck
    }
  }

  public addNote(note: SNNote): void {
    if (this.immutableItem.isReferencingItem(note)) {
      return
    }

    const reference: NoteToNoteReference = {
      uuid: note.uuid,
      content_type: ContentType.TYPES.Note,
      reference_type: ContentReferenceType.NoteToNote,
    }

    this.mutableContent.references.push(reference)
  }

  public removeNote(note: SNNote): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== note.uuid)
  }
}
