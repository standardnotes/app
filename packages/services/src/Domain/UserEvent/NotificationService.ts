import { NotificationServerHash } from '@standardnotes/responses'
import { NotificationAddedForUserEvent } from '@standardnotes/domain-events'
import { SyncEvent, SyncEventReceivedNotificationsData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { NotificationServiceEventPayload, NotificationServiceEvent } from './NotificationServiceEvent'
import { NotificationPayload } from '@standardnotes/domain-core'
import { WebSocketsServiceEvent } from '../Api/WebSocketsServiceEvent'

export class NotificationService
  extends AbstractService<NotificationServiceEvent, NotificationServiceEventPayload>
  implements InternalEventHandlerInterface
{
  private handledNotifications = new Set<string>()

  constructor(internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    switch (event.type) {
      case SyncEvent.ReceivedNotifications:
        return this.handleReceivedNotifications(event.payload as SyncEventReceivedNotificationsData)
      case WebSocketsServiceEvent.NotificationAddedForUser:
        return this.handleReceivedNotifications([(event as NotificationAddedForUserEvent).payload.notification])
      default:
        break
    }
  }

  private async handleReceivedNotifications(notifications: NotificationServerHash[]): Promise<void> {
    if (notifications.length === 0) {
      return
    }

    for (const notification of notifications) {
      if (this.handledNotifications.has(notification.uuid)) {
        continue
      }

      this.handledNotifications.add(notification.uuid)

      const eventPayloadOrError = NotificationPayload.createFromString(notification.payload)
      if (eventPayloadOrError.isFailed()) {
        continue
      }

      const payload: NotificationPayload = eventPayloadOrError.getValue()

      const serviceEvent: NotificationServiceEventPayload = { eventPayload: payload }

      await this.notifyEventSync(NotificationServiceEvent.NotificationReceived, serviceEvent)
    }
  }
}
