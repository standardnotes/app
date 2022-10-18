import { AppDataField } from './../../Abstract/Item/Types/AppDataField'
import { ContentType } from '@standardnotes/common'
import { FeatureIdentifier, NoteType } from '@standardnotes/features'
import { DecryptedItem } from '../../Abstract/Item/Implementations/DecryptedItem'
import { ItemInterface } from '../../Abstract/Item/Interfaces/ItemInterface'
import { DecryptedPayloadInterface } from '../../Abstract/Payload/Interfaces/DecryptedPayload'
import { NoteContent, NoteContentSpecialized } from './NoteContent'

export const isNote = (x: ItemInterface): x is SNNote => x.content_type === ContentType.Note

export class SNNote extends DecryptedItem<NoteContent> implements NoteContentSpecialized {
  public readonly title: string
  public readonly text: string
  public readonly hidePreview: boolean = false
  public readonly preview_plain: string
  public readonly preview_html: string
  public readonly spellcheck?: boolean
  public readonly noteType?: NoteType
  public readonly authorizedForListed: boolean

  /** The package_info.identifier of the editor (not its uuid), such as org.standardnotes.advanced-markdown */
  public readonly editorIdentifier?: FeatureIdentifier | string

  constructor(payload: DecryptedPayloadInterface<NoteContent>) {
    super(payload)

    this.title = String(this.payload.content.title || '')
    this.text = String(this.payload.content.text || '')
    this.preview_plain = String(this.payload.content.preview_plain || '')
    this.preview_html = String(this.payload.content.preview_html || '')
    this.hidePreview = Boolean(this.payload.content.hidePreview)
    this.spellcheck = this.payload.content.spellcheck
    this.noteType = this.payload.content.noteType
    this.editorIdentifier = this.payload.content.editorIdentifier
    this.authorizedForListed = this.payload.content.authorizedForListed || false

    if (!this.noteType) {
      const prefersPlain = this.getAppDomainValueWithDefault(AppDataField.LegacyPrefersPlainEditor, false)
      if (prefersPlain) {
        this.noteType = NoteType.Plain
      }
    }
  }
}
