import { WebApplication } from '@/Application/Application'
import { NoteBlock, NoteMutator, SNComponent, SNNote } from '@standardnotes/snjs'
import { BlockOption } from './BlockMenu/BlockOption'

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

  async addNewBlock(option: BlockOption): Promise<void> {
    if (!option.component) {
      throw new Error('Non-component block options are not supported yet')
    }

    const block = this.createBlockItem(option.component)
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.addBlock(block)
    })
  }

  async removeBlock(block: NoteBlock): Promise<void> {
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.removeBlock(block)
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
