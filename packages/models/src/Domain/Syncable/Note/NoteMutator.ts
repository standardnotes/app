import { NoteContent } from './NoteContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { SNNote } from './Note'
import { NoteToNoteReference } from '../../Abstract/Reference/NoteToNoteReference'
import { ContentReferenceType } from '../../Abstract/Item'
import { NoteType } from '@standardnotes/features'
import { EditorLineWidth } from '../UserPrefs'
import { ContentType } from '@standardnotes/domain-core'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'

export class NoteMutator extends DecryptedItemMutator<NoteContent> {
  private shouldStampLastCaretAt = false

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

  setLastCaret(offset: number): void {
    this.mutableContent.lastCaretOffset = offset
    this.shouldStampLastCaretAt = true
  }

  clearLastCaret(): void {
    this.mutableContent.lastCaretOffset = undefined
    this.mutableContent.lastCaretAt = undefined
    this.shouldStampLastCaretAt = false
  }

  override getResult(): DecryptedPayloadInterface<NoteContent> {
    const result = super.getResult()

    if (!this.shouldStampLastCaretAt) {
      return result
    }

    const content: NoteContent = { ...result.content, lastCaretAt: Date.now() }

    return result.copy({ content })
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
