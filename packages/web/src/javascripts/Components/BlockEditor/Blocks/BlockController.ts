import { WebApplication } from '@/Application/Application'
import { debounce } from '@/Utils'
import { NoteBlock, SNNote, NoteMutator, BlockValues } from '@standardnotes/snjs'

export class BlockController {
  private values: BlockValues

  constructor(private block: NoteBlock, private note: SNNote, private application: WebApplication) {
    this.debounceSave = debounce(this.debounceSave, 100)
    this.values = {
      content: block.content,
      previewPlain: note.preview_plain,
      previewHtml: note.preview_html,
    }
  }

  deinit() {
    ;(this.application as unknown) = undefined
    ;(this.note as unknown) = undefined
    ;(this.block as unknown) = undefined
    ;(this.values as unknown) = undefined
  }

  public save = (values: BlockValues) => {
    this.values = values
    void this.debounceSave()
  }

  private debounceSave = () => {
    void this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.changeBlockValues(this.block.id, this.values)
    })
  }
}
