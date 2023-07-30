import { UserEventServerHash } from '@standardnotes/responses'
import { SyncEvent, SyncEventReceivedUserEventsData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { UserEventServiceEventPayload, UserEventServiceEvent } from './UserEventServiceEvent'
import { NotificationPayload } from '@standardnotes/domain-core'

export class UserEventService
  extends AbstractService<UserEventServiceEvent, UserEventServiceEventPayload>
  implements InternalEventHandlerInterface
{
  // private handledNotifications = new Set<string>()

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
      const eventPayloadOrError = NotificationPayload.createFromString(serverEvent.payload)
      if (eventPayloadOrError.isFailed()) {
        continue
      }

      const notification: NotificationPayload = eventPayloadOrError.getValue()

      /** @TODO - Need a notification unique uuid */
      // if (this.handledNotifications.has(notification.props.uuid)) {
      //   continue
      // }

      const serviceEvent: UserEventServiceEventPayload = { eventPayload: notification }

      await this.notifyEventSync(UserEventServiceEvent.UserEventReceived, serviceEvent)
    }
  }
}
