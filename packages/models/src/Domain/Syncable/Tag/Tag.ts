import { ContentType, Uuid } from '@standardnotes/common'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { ContentReference } from '../../Abstract/Reference/ContentReference'
import { isTagToParentTagReference } from '../../Abstract/Reference/Functions'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'

export const TagFolderDelimitter = '.'

export type TagIconType = 'icon' | 'emoji'

interface TagInterface {
  title: string
  expanded: boolean
  iconType: TagIconType
  iconString: string
}

const DefaultIconType: TagIconType = 'icon'
const DefaultIconName = 'hashtag'

export type TagContent = TagInterface & ItemContent

export const isTag = (x: ItemInterface): x is SNTag => x.content_type === ContentType.Tag

export class SNTag extends DecryptedItem<TagContent> implements TagInterface {
  public readonly title: string
  public readonly iconType: TagIconType
  public readonly iconString: string

  /** Whether to render child tags in view hierarchy. Opposite of collapsed. */
  public readonly expanded: boolean

  constructor(payload: DecryptedPayloadInterface<TagContent>) {
    super(payload)
    this.title = this.payload.content.title || ''
    this.expanded = this.payload.content.expanded != undefined ? this.payload.content.expanded : true
    this.iconType = this.payload.content.iconType || DefaultIconType
    this.iconString = this.payload.content.iconString || DefaultIconName
  }

  get noteReferences(): ContentReference[] {
    const references = this.payload.references
    return references.filter((ref) => ref.content_type === ContentType.Note)
  }

  get noteCount(): number {
    return this.noteReferences.length
  }

  public get parentId(): Uuid | undefined {
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
