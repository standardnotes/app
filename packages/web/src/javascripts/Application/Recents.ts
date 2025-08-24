import { DecryptedItem } from '@standardnotes/snjs'

const MaxItems = 10

export class RecentItemsState {
  #itemUuids: string[] = []

  /**
   * The recent items, most recent at the start
   */
  get itemUuids() {
    return this.#itemUuids
  }

  add(item: DecryptedItem) {
    const existing = this.#itemUuids.findIndex((uuid) => uuid === item.uuid)
    if (existing !== -1) {
      this.#itemUuids.splice(existing, 1)
    }
    if (this.#itemUuids.length == MaxItems) {
      this.#itemUuids.pop()
    }
    this.#itemUuids.unshift(item.uuid)
  }
}
