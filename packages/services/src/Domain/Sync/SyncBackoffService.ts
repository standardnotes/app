import { AnyItemInterface, ServerSyncPushContextualPayload } from '@standardnotes/models'
import { Uuid } from '@standardnotes/domain-core'

import { SyncBackoffServiceInterface } from './SyncBackoffServiceInterface'
import { AbstractService } from '../Service/AbstractService'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { SyncEvent } from '../Event/SyncEvent'

export class SyncBackoffService
  extends AbstractService
  implements SyncBackoffServiceInterface, InternalEventHandlerInterface
{
  private INITIAL_BACKOFF_PENALTY_MS = 1_000
  private SUBSET_BACKOFF_PENALTY_CUTOFF_MS = 10_000

  private backoffPenalties: Map<string, number>
  private backoffStartTimestamps: Map<string, number>
  private itemUuidsThatHaveBeenTriedSolelyAsPayload: Set<string>

  constructor(protected override internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)

    this.backoffPenalties = new Map<string, number>()
    this.backoffStartTimestamps = new Map<string, number>()
    this.itemUuidsThatHaveBeenTriedSolelyAsPayload = new Set<string>()
  }

  getSmallerSubsetOfItemUuidsInBackoff(): Uuid[] {
    const uuids = Array.from(this.backoffPenalties.keys())

    const uuidsThatHaveNotBeenTriedAsSingleItemRequests = uuids.filter(
      (uuid) => !this.itemUuidsThatHaveBeenTriedSolelyAsPayload.has(uuid),
    )

    if (uuidsThatHaveNotBeenTriedAsSingleItemRequests.length === 0) {
      return []
    }

    const uuidsSortedByPenaltyAscending = uuidsThatHaveNotBeenTriedAsSingleItemRequests.sort((a, b) => {
      const penaltyA = this.backoffPenalties.get(a) || 0
      const penaltyB = this.backoffPenalties.get(b) || 0

      return penaltyA - penaltyB
    })

    const halfLength = Math.ceil(uuidsSortedByPenaltyAscending.length / 2)

    const halfOfUuidsSortedByPenaltyAscendingMeetingCutoff = []
    let penaltySum = 0
    for (let i = 0; i < halfLength; i++) {
      const uuid = uuidsSortedByPenaltyAscending[i]

      penaltySum += this.backoffPenalties.get(uuid) || 0

      if (penaltySum <= this.SUBSET_BACKOFF_PENALTY_CUTOFF_MS) {
        halfOfUuidsSortedByPenaltyAscendingMeetingCutoff.push(uuid)
      }
    }

    return halfOfUuidsSortedByPenaltyAscendingMeetingCutoff.map((uuid) => Uuid.create(uuid).getValue())
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (
      event.type !== SyncEvent.PaginatedSyncRequestCompleted ||
      event.payload === undefined ||
      (event.payload as Record<string, unknown>).uploadedPayloads === undefined
    ) {
      return
    }

    for (const payload of (event.payload as Record<string, unknown>)
      .uploadedPayloads as ServerSyncPushContextualPayload[]) {
      this.backoffPenalties.delete(payload.uuid)
      this.backoffStartTimestamps.delete(payload.uuid)
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

  backoffItems(itemUuids: Uuid[]): void {
    for (const itemUuid of itemUuids) {
      this.backoffItem(itemUuid)
    }

    if (itemUuids.length === 1) {
      this.itemUuidsThatHaveBeenTriedSolelyAsPayload.add(itemUuids[0].value)
    }
  }

  private backoffItem(itemUuid: Uuid): void {
    const backoffPenalty = this.backoffPenalties.get(itemUuid.value) || 0

    const newBackoffPenalty = backoffPenalty === 0 ? this.INITIAL_BACKOFF_PENALTY_MS : backoffPenalty * 2

    this.backoffPenalties.set(itemUuid.value, newBackoffPenalty)
    this.backoffStartTimestamps.set(itemUuid.value, Date.now())
  }
}
