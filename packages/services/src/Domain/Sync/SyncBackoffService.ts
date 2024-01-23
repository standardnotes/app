import { AnyItemInterface } from '@standardnotes/models'
import { SyncBackoffServiceInterface } from './SyncBackoffServiceInterface'

export class SyncBackoffService implements SyncBackoffServiceInterface {
  private backoffPenalties: Map<string, number>
  private backoffStartTimestamps: Map<string, number>

  constructor() {
    this.backoffPenalties = new Map<string, number>()
    this.backoffStartTimestamps = new Map<string, number>()
  }

  isItemInBackoff(item: AnyItemInterface): boolean {
    const backoffStartingTimestamp = this.backoffStartTimestamps.get(item.uuid)
    if (!backoffStartingTimestamp) {
      return false
    }

    const backoffPenalty = this.backoffPenalties.get(item.uuid)
    if (!backoffPenalty) {
      return false
    }

    const backoffEndTimestamp = backoffStartingTimestamp + backoffPenalty

    return backoffEndTimestamp > Date.now()
  }

  backoffItem(item: AnyItemInterface): void {
    const backoffPenalty = this.backoffPenalties.get(item.uuid) || 0

    const newBackoffPenalty = backoffPenalty === 0 ? 1_000 : backoffPenalty * 2

    this.backoffPenalties.set(item.uuid, newBackoffPenalty)
    this.backoffStartTimestamps.set(item.uuid, Date.now())
  }
}
