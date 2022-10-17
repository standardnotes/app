import { ContentType } from '@standardnotes/common'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { AppDataField } from '../../Abstract/Item/Types/AppDataField'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { NoteContent, NoteContentSpecialized } from './NoteContent'

export const isNote = (x: ItemInterface): x is SNNote => x.content_type === ContentType.Note

export class SNNote extends DecryptedItem<NoteContent> implements NoteContentSpecialized {
  public readonly title: string
  public readonly text: string
  public readonly mobilePrefersPlainEditor?: boolean
  public readonly hidePreview: boolean = false
  public readonly preview_plain: string
  public readonly preview_html: string
  public readonly prefersPlainEditor: boolean
  public readonly spellcheck?: boolean
  public readonly starred?: boolean

  constructor(payload: DecryptedPayloadInterface<NoteContent>) {
    super(payload)

    this.title = String(this.payload.content.title || '')
    this.text = String(this.payload.content.text || '')
    this.preview_plain = String(this.payload.content.preview_plain || '')
    this.preview_html = String(this.payload.content.preview_html || '')
    this.hidePreview = Boolean(this.payload.content.hidePreview)
    this.spellcheck = this.payload.content.spellcheck
    this.starred = this.payload.content.starred

    this.prefersPlainEditor = this.getAppDomainValueWithDefault(AppDataField.PrefersPlainEditor, false)

    this.mobilePrefersPlainEditor = this.payload.content.mobilePrefersPlainEditor
  }
}
