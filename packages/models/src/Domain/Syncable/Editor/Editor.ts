import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemContent } from '../../Abstract/Content/ItemContent'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { SNNote } from '../Note/Note'

interface EditorContent extends ItemContent {
  notes: SNNote[]
  data: Record<string, unknown>
  url: string
  name: string
  default: boolean
  systemEditor: boolean
}

/**
 * @deprecated
 * Editor objects are depracated in favor of ComponentItem objects
 */
export class SNEditor extends DecryptedItem<EditorContent> {
  public readonly notes: SNNote[] = []
  public readonly data: Record<string, unknown> = {}
  public readonly url: string
  public readonly name: string
  public readonly isDefault: boolean
  public readonly systemEditor: boolean

  constructor(payload: DecryptedPayloadInterface<EditorContent>) {
    super(payload)
    this.url = payload.content.url
    this.name = payload.content.name
    this.data = payload.content.data || {}
    this.isDefault = payload.content.default
    this.systemEditor = payload.content.systemEditor
  }
}
