import { UserEventServerHash } from '@standardnotes/responses'
import { SyncEvent, SyncEventReceivedUserEventsData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { UserEventServiceEventPayload, UserEventServiceEvent } from './UserEventServiceEvent'

export class UserEventService
  extends AbstractService<UserEventServiceEvent, UserEventServiceEventPayload>
  implements InternalEventHandlerInterface
{
  constructor(internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)

    internalEventBus.addEventHandler(this, SyncEvent.ReceivedUserEvents)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SyncEvent.ReceivedUserEvents) {
      return this.handleReceivedUserEvents(event.payload as SyncEventReceivedUserEventsData)
    }
  }

  private async handleReceivedUserEvents(userEvents: UserEventServerHash[]): Promise<void> {
    if (userEvents.length === 0) {
      return
    }

    for (const serverEvent of userEvents) {
      const serviceEvent: UserEventServiceEventPayload = {
        eventPayload: JSON.parse(serverEvent.event_payload),
      }

      await this.notifyEventSync(UserEventServiceEvent.UserEventReceived, serviceEvent)
    }
  }
}
