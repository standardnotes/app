import { WebApplication } from '@/Application/Application'
import { NoteMutator, SNNote, Uuid, EditorSaveTimeoutDebounce } from '@standardnotes/snjs'

export class BlockEditorController {
  private saveTimeout?: ReturnType<typeof setTimeout>
  constructor(private noteUuid: Uuid, private application: WebApplication) {}

  deinit() {
    ;(this.noteUuid as unknown) = undefined
    ;(this.application as unknown) = undefined
  }

  save(values: { text: string; previewPlain: string; previewHtml?: string }): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    const noDebounce = this.application.noAccount()

    const syncDebouceMs = noDebounce
      ? EditorSaveTimeoutDebounce.ImmediateChange
      : this.application.isNativeMobileWeb()
      ? EditorSaveTimeoutDebounce.NativeMobileWeb
      : EditorSaveTimeoutDebounce.Desktop

    this.saveTimeout = setTimeout(() => {
      void this.saveAndWait(values)
    }, syncDebouceMs)
  }

  async saveAndWait(values: { text: string; previewPlain: string; previewHtml?: string }): Promise<void> {
    const note = this.application.items.findSureItem<SNNote>(this.noteUuid)

    await this.application.mutator.changeItem<NoteMutator>(note, (mutator) => {
      mutator.text = values.text
      mutator.preview_plain = values.previewPlain
      mutator.preview_html = values.previewHtml
    })

    void this.application.sync.sync()
  }
}
