import { WebApplication } from '@/Application/Application'
import { NoteMutator, SNNote } from '@standardnotes/snjs'

export class BlockEditorController {
  constructor(private note: SNNote, private application: WebApplication) {
    this.note = note
    this.application = application
  }

  deinit() {
    ;(this.note as unknown) = undefined
    ;(this.application as unknown) = undefined
  }

  async save(values: { text: string; previewPlain: string; previewHtml?: string }): Promise<void> {
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.text = values.text
      mutator.preview_plain = values.previewPlain
      mutator.preview_html = values.previewHtml
    })
  }
}
