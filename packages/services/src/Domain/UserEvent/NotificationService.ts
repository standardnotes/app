import { NotificationServerHash } from '@standardnotes/responses'
import { SyncEvent, SyncEventReceivedNotificationsData } from '../Event/SyncEvent'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventHandlerInterface } from '../Internal/InternalEventHandlerInterface'
import { InternalEventInterface } from '../Internal/InternalEventInterface'
import { AbstractService } from '../Service/AbstractService'
import { NotificationServiceEventPayload, NotificationServiceEvent } from './NotificationServiceEvent'
import { NotificationPayload } from '@standardnotes/domain-core'

export class NotificationService
  extends AbstractService<NotificationServiceEvent, NotificationServiceEventPayload>
  implements InternalEventHandlerInterface
{
  private handledNotifications = new Set<string>()

  constructor(internalEventBus: InternalEventBusInterface) {
    super(internalEventBus)

    internalEventBus.addEventHandler(this, SyncEvent.ReceivedNotifications)
  }

  async handleEvent(event: InternalEventInterface): Promise<void> {
    if (event.type === SyncEvent.ReceivedNotifications) {
      return this.handleReceivedNotifications(event.payload as SyncEventReceivedNotificationsData)
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
