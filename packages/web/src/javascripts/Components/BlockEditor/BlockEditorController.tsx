import { WebApplication } from '@/Application/Application'
import { NoteBlock, NoteMutator, SNComponent, SNNote } from '@standardnotes/snjs'

export class BlockEditorController {
  constructor(private note: SNNote, private application: WebApplication) {
    this.note = note
    this.application = application
  }

  deinit() {
    ;(this.note as unknown) = undefined
    ;(this.application as unknown) = undefined
  }

  createBlockItem(editor: SNComponent): NoteBlock {
    const id = this.application.generateUuid()
    const block: NoteBlock = {
      id: id,
      editorIdentifier: editor.identifier,
      type: editor.noteType,
      content: '',
    }

    return block
  }

  async addNewBlock(editor: SNComponent): Promise<void> {
    const block = this.createBlockItem(editor)
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.addBlock(block)
    })
  }

  async saveBlockSize(block: NoteBlock, size: { width: number; height: number }): Promise<void> {
    if (block.size?.height === size.height) {
      return
    }

    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.changeBlockSize(block.id, size)
    })
  }
}
