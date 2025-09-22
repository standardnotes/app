const MaxCommands = 5
const MaxItems = 10

export class RecentActionsState {
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

  add(id: string, action_type: 'item' | 'command' = 'item') {
    const action_array = action_type === 'item' ? this.#itemUuids : this.#commandUuids
    const existing = action_array.findIndex((uuid) => uuid === id)
    if (existing !== -1) {
      action_array.splice(existing, 1)
    }
    const max = action_type === 'item' ? MaxItems : MaxCommands
    if (action_array.length == max) {
      action_array.pop()
    }
    action_array.unshift(id)
  }
}
