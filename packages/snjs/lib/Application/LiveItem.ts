import { DecryptedItemInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'

/** Keeps an item reference up to date with changes */
export class LiveItem<T extends DecryptedItemInterface> {
  public item: T
  private removeObserver: () => void

  constructor(uuid: string, items: ItemManagerInterface, onChange?: (item: T) => void) {
    this.item = items.findSureItem(uuid)

    onChange && onChange(this.item)

    this.removeObserver = items.streamItems(this.item.content_type, ({ changed, inserted }) => {
      const matchingItem = [...changed, ...inserted].find((item) => {
        return item.uuid === uuid
      })

      if (matchingItem) {
        this.item = matchingItem as T
        onChange && onChange(this.item)
      }
    })
  }

  public deinit() {
    if (!this.removeObserver) {
      console.error('A LiveItem is attempting to be deinited more than once.')
    } else {
      this.removeObserver()
      ;(this.removeObserver as unknown) = undefined
    }
  }
}
