import { FileItem } from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'
import { ItemViewControllerInterface } from './ItemViewControllerInterface'
import { ItemManagerInterface } from '@standardnotes/snjs'

export class FileViewController implements ItemViewControllerInterface {
  public dealloced = false
  private removeStreamObserver?: () => void
  public runtimeId = `${Math.random()}`

  constructor(
    public item: FileItem,
    private items: ItemManagerInterface,
  ) {}

  deinit() {
    this.dealloced = true
    this.removeStreamObserver?.()
    ;(this.removeStreamObserver as unknown) = undefined
    ;(this.item as unknown) = undefined
  }

  async initialize() {
    this.streamItems()
  }

  private streamItems() {
    this.removeStreamObserver = this.items.streamItems<FileItem>(ContentType.TYPES.File, ({ changed, inserted }) => {
      if (this.dealloced) {
        return
      }

      const files = changed.concat(inserted)

      const matchingFile = files.find((item) => {
        return item.uuid === this.item.uuid
      })

      if (matchingFile) {
        this.item = matchingFile
      }
    })
  }
}
