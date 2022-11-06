import { WebApplication } from '@/Application/Application'
import { BlockType, NoteBlock, NoteMutator, SNComponent, SNNote, BlockValues } from '@standardnotes/snjs'
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

  createComponentBlockItem(component: SNComponent): NoteBlock {
    return {
      id: this.application.generateUuid(),
      componentIdentifier: component.identifier,
      type: BlockType.Component,
      content: '',
      previewPlain: '',
    }
  }

  createBlockItem(type: BlockType): NoteBlock {
    return {
      id: this.application.generateUuid(),
      type: type,
      content: '',
      previewPlain: '',
    }
  }

  async addNewBlock(option: BlockOption): Promise<void> {
    let block: NoteBlock
    if (option.component) {
      block = this.createComponentBlockItem(option.component)
    } else if (option.type === BlockType.Plaintext) {
      block = this.createBlockItem(BlockType.Plaintext)
    } else if (option.type === BlockType.Quote) {
      block = this.createBlockItem(BlockType.Quote)
    } else {
      throw new Error('Unsupported block type')
    }

    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.addBlock(block)
    })
  }

  async removeBlock(block: NoteBlock): Promise<void> {
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.removeBlock(block)
    })
  }

  async changeBlock(block: NoteBlock, values: BlockValues): Promise<void> {
    await this.application.mutator.changeAndSaveItem<NoteMutator>(this.note, (mutator) => {
      mutator.changeBlockValues(block.id, values)
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
