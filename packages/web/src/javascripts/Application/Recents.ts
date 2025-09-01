const MaxCommands = 5
const MaxItems = 10

export class RecentItemsState {
  #commandUuids: string[] = []
  #itemUuids: string[] = []

  /**
   * Recently used commands, most recent at the start
   */
  get commandUuids() {
    return this.#commandUuids
  }
  /**
   * Recently opened items, most recent at the start
   */
  get itemUuids() {
    return this.#itemUuids
  }

  add(id: string, type: 'item' | 'command' = 'item') {
    const array = type === 'item' ? this.#itemUuids : this.#commandUuids
    const existing = array.findIndex((uuid) => uuid === id)
    if (existing !== -1) {
      array.splice(existing, 1)
    }
    const max = type === 'item' ? MaxItems : MaxCommands
    if (array.length == max) {
      array.pop()
    }
    array.unshift(id)
  }
}
