import { NoteContent } from './NoteContent'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { SNNote } from './Note'
import { NoteToNoteReference } from '../../Abstract/Reference/NoteToNoteReference'
import { ContentType } from '@standardnotes/common'
import { ContentReferenceType } from '../../Abstract/Item'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { NoteBlock } from './NoteBlocks'
import { filterFromArray } from '@standardnotes/utils'

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

  set noteType(noteType: NoteType) {
    this.mutableContent.noteType = noteType
  }

  set editorIdentifier(identifier: FeatureIdentifier | string | undefined) {
    this.mutableContent.editorIdentifier = identifier
  }

  set authorizedForListed(authorizedForListed: boolean) {
    this.mutableContent.authorizedForListed = authorizedForListed
  }

  addBlock(block: NoteBlock): void {
    if (!this.mutableContent.blocksItem) {
      this.mutableContent.blocksItem = { blocks: [] }
    }

    this.mutableContent.blocksItem.blocks.push(block)
  }

  removeBlock(block: NoteBlock): void {
    if (!this.mutableContent.blocksItem) {
      return
    }

    filterFromArray(this.mutableContent.blocksItem.blocks, { id: block.id })
  }

  changeBlockContent(blockId: string, content: string): void {
    const blockIndex = this.mutableContent.blocksItem?.blocks.findIndex((b) => {
      return b.id === blockId
    })

    if (blockIndex == null || blockIndex === -1) {
      return
    }

    const block = this.mutableContent.blocksItem?.blocks[blockIndex]
    if (!block) {
      return
    }

    block.content = content
  }

  changeBlockSize(blockId: string, size: { width: number; height: number }): void {
    const block = this.mutableContent.blocksItem?.blocks.find((b) => b.id === blockId)
    if (!block) {
      return
    }

    block.size = size
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
      content_type: ContentType.Note,
      reference_type: ContentReferenceType.NoteToNote,
    }

    this.mutableContent.references.push(reference)
  }

  public removeNote(note: SNNote): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== note.uuid)
  }
}
