import { InternalEventInterface } from './InternalEventInterface'
import { InternalEventType } from './InternalEventType'
import { InternalEventHandlerInterface } from './InternalEventHandlerInterface'
import { InternalEventPublishStrategy } from '..'

export interface InternalEventBusInterface {
  /**
   * Associate an event handler with a certain event type
   * @param handler event handler instance
   * @param eventType event type to associate with
   */
  addEventHandler(handler: InternalEventHandlerInterface, eventType: InternalEventType): void
  /**
   * Asynchronously publish an event for handling
   * @param event internal event object
   */
  publish(event: InternalEventInterface): void
  /**
   * Synchronously publish an event for handling.
   * This will await for all handlers to finish processing the event.
   * @param event internal event object
   * @param strategy strategy with which the handlers will process the event.
   * Either all handlers will start at once or they will do it sequentially.
   */
  publishSync(event: InternalEventInterface, strategy: InternalEventPublishStrategy): Promise<void>

  deinit(): void
}
