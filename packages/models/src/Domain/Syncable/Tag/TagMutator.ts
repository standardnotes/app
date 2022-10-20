import { ContentType } from '@standardnotes/common'
import { TagContent, SNTag, TagIconType } from './Tag'
import { FileItem } from '../File'
import { SNNote } from '../Note'
import { isTagToParentTagReference } from '../../Abstract/Reference/Functions'
import { TagToParentTagReference } from '../../Abstract/Reference/TagToParentTagReference'
import { ContentReferenceType } from '../../Abstract/Reference/ContenteReferenceType'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { TagToFileReference } from '../../Abstract/Reference/TagToFileReference'

export class TagMutator extends DecryptedItemMutator<TagContent> {
  set title(title: string) {
    this.mutableContent.title = title
  }

  set expanded(expanded: boolean) {
    this.mutableContent.expanded = expanded
  }

  set iconType(iconType: TagIconType) {
    this.mutableContent.iconType = iconType
  }

  set iconString(iconString: string) {
    this.mutableContent.iconString = iconString
  }

  public makeChildOf(tag: SNTag): void {
    const references = this.immutableItem.references.filter((ref) => !isTagToParentTagReference(ref))

    const reference: TagToParentTagReference = {
      reference_type: ContentReferenceType.TagToParentTag,
      content_type: ContentType.Tag,
      uuid: tag.uuid,
    }

    references.push(reference)

    this.mutableContent.references = references
  }

  public unsetParent(): void {
    this.mutableContent.references = this.immutableItem.references.filter((ref) => !isTagToParentTagReference(ref))
  }

  public addFile(file: FileItem): void {
    if (this.immutableItem.isReferencingItem(file)) {
      return
    }

    const reference: TagToFileReference = {
      reference_type: ContentReferenceType.TagToFile,
      content_type: ContentType.File,
      uuid: file.uuid,
    }

    this.mutableContent.references.push(reference)
  }

  public removeFile(file: FileItem): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== file.uuid)
  }

  public addNote(note: SNNote): void {
    if (this.immutableItem.isReferencingItem(note)) {
      return
    }

    this.mutableContent.references.push({
      uuid: note.uuid,
      content_type: note.content_type,
    })
  }

  public removeNote(note: SNNote): void {
    this.mutableContent.references = this.mutableContent.references.filter((r) => r.uuid !== note.uuid)
  }
}
