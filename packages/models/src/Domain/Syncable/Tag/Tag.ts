import { VectorIconNameOrEmoji, IconType } from './../../Utilities/Icon/IconType'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { ContentReference } from '../../Abstract/Reference/ContentReference'
import { isTagToParentTagReference } from '../../Abstract/Reference/Functions'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { TagContent, TagContentSpecialized } from './TagContent'
import { TagPreferences } from './TagPreferences'
import { ContentType } from '@standardnotes/domain-core'

export const TagFolderDelimitter = '.'

export const DefaultTagIconName: IconType = 'hashtag'

export const isTag = (x: ItemInterface): x is SNTag => x.content_type === ContentType.TYPES.Tag

export class SNTag extends DecryptedItem<TagContent> implements TagContentSpecialized {
  public readonly title: string
  public readonly iconString: VectorIconNameOrEmoji
  public readonly expanded: boolean
  public readonly preferences?: TagPreferences

  constructor(payload: DecryptedPayloadInterface<TagContent>) {
    super(payload)
    this.title = this.payload.content.title || ''
    this.expanded = this.payload.content.expanded != undefined ? this.payload.content.expanded : true
    this.iconString = this.payload.content.iconString || DefaultTagIconName
    this.preferences = this.payload.content.preferences
  }

  get isDailyEntry(): boolean {
    return this.preferences?.entryMode === 'daily'
  }

  get noteReferences(): ContentReference[] {
    const references = this.payload.references
    return references.filter((ref) => ref.content_type === ContentType.TYPES.Note)
  }

  get noteCount(): number {
    return this.noteReferences.length
  }

  public get parentId(): string | undefined {
    const reference = this.references.find(isTagToParentTagReference)
    return reference?.uuid
  }

  public static arrayToDisplayString(tags: SNTag[]): string {
    return tags
      .sort((a, b) => {
        return a.title > b.title ? 1 : -1
      })
      .map((tag) => {
        return '#' + tag.title
      })
      .join(' ')
  }
}
