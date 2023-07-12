import { SNTag } from './Tag'
import { TagContent } from './TagContent'
import { FileItem } from '../File'
import { SNNote } from '../Note'
import { isTagToParentTagReference } from '../../Abstract/Reference/Functions'
import { TagToParentTagReference } from '../../Abstract/Reference/TagToParentTagReference'
import { ContentReferenceType } from '../../Abstract/Reference/ContenteReferenceType'
import { DecryptedItemMutator } from '../../Abstract/Item/Mutator/DecryptedItemMutator'
import { TagToFileReference } from '../../Abstract/Reference/TagToFileReference'
import { TagPreferences } from './TagPreferences'
import { DecryptedItemInterface, MutationType } from '../../Abstract/Item'
import { ContentType } from '@standardnotes/domain-core'

export class TagMutator<Content extends TagContent = TagContent> extends DecryptedItemMutator<Content> {
  private mutablePreferences?: TagPreferences

  constructor(item: DecryptedItemInterface<Content>, type: MutationType) {
    super(item, type)

    this.mutablePreferences = this.mutableContent.preferences
  }

  set title(title: string) {
    this.mutableContent.title = title
  }

  set expanded(expanded: boolean) {
    this.mutableContent.expanded = expanded
  }

  set iconString(iconString: string) {
    this.mutableContent.iconString = iconString
  }

  get preferences(): TagPreferences {
    if (!this.mutablePreferences) {
      this.mutableContent.preferences = {}
      this.mutablePreferences = this.mutableContent.preferences
    }

    return this.mutablePreferences
  }

  set preferences(preferences: TagPreferences | undefined) {
    this.mutablePreferences = preferences
    this.mutableContent.preferences = this.mutablePreferences
  }

  public makeChildOf(tag: SNTag): void {
    const references = this.immutableItem.references.filter((ref) => !isTagToParentTagReference(ref))

    const reference: TagToParentTagReference = {
      reference_type: ContentReferenceType.TagToParentTag,
      content_type: ContentType.TYPES.Tag,
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
      content_type: ContentType.TYPES.File,
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
