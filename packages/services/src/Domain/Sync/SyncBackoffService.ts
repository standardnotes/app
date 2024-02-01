import { AnyItemInterface, ServerSyncPushContextualPayload } from '@standardnotes/models'
import { Uuid } from '@standardnotes/domain-core'

import { SyncBackoffServiceInterface } from './SyncBackoffServiceInterface'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { ApplicationEvent } from '../Event/ApplicationEvent'

export class SyncBackoffService
  extends AbstractService
  implements SyncBackoffServiceInterface, InternalEventHandlerInterface
{
  private backoffPenalties: Map<string, number>
  private backoffStartTimestamps: Map<string, number>

  constructor(protected override internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)

    this.backoffPenalties = new Map<string, number>()
    this.backoffStartTimestamps = new Map<string, number>()
  }

  getSmallerSubsetOfItemUuidsInBackoff(): Uuid[] {
    const uuids = Array.from(this.backoffPenalties.keys())

    const uuidsSortedByPenaltyAscending = uuids.sort((a, b) => {
      const penaltyA = this.backoffPenalties.get(a) || 0
      const penaltyB = this.backoffPenalties.get(b) || 0

      return penaltyA - penaltyB
    })

    const halfLength = Math.ceil(uuidsSortedByPenaltyAscending.length / 2)

    return uuidsSortedByPenaltyAscending.slice(0, halfLength).map((uuid) => Uuid.create(uuid).getValue())
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === ApplicationEvent.CompletedIncrementalSync) {
      for (const payload of (event.payload as Record<string, unknown>)
        .uploadedPayloads as ServerSyncPushContextualPayload[]) {
        this.backoffPenalties.delete(payload.uuid)
        this.backoffStartTimestamps.delete(payload.uuid)
      }
    }
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

  backoffItem(itemUuid: Uuid): void {
    const backoffPenalty = this.backoffPenalties.get(itemUuid.value) || 0

    const newBackoffPenalty = backoffPenalty === 0 ? 1_000 : backoffPenalty * 2

    this.backoffPenalties.set(itemUuid.value, newBackoffPenalty)
    this.backoffStartTimestamps.set(itemUuid.value, Date.now())
  }
}
