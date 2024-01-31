import { AnyItemInterface, ServerSyncPushContextualPayload } from '@standardnotes/models'

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

  backoffItem(item: AnyItemInterface): void {
    const backoffPenalty = this.backoffPenalties.get(item.uuid) || 0

    const newBackoffPenalty = backoffPenalty === 0 ? 1_000 : backoffPenalty * 2

    this.backoffPenalties.set(item.uuid, newBackoffPenalty)
    this.backoffStartTimestamps.set(item.uuid, Date.now())
  }
}
