import { InternalEventBusInterface } from './InternalEventBusInterface'
import { InternalEventHandlerInterface } from './InternalEventHandlerInterface'
import { InternalEventInterface } from './InternalEventInterface'
import { InternalEventPublishStrategy } from './InternalEventPublishStrategy'
import { InternalEventType } from './InternalEventType'

export class InternalEventBus implements InternalEventBusInterface {
  private eventHandlers: Map<InternalEventType, InternalEventHandlerInterface[]>

  constructor() {
    this.eventHandlers = new Map<InternalEventType, InternalEventHandlerInterface[]>()
  }

  deinit(): void {
    ;(this.eventHandlers as unknown) = undefined
  }

  addEventHandler(handler: InternalEventHandlerInterface, eventType: string): void {
    let handlersForEventType = this.eventHandlers.get(eventType)
    if (handlersForEventType === undefined) {
      handlersForEventType = []
    }

    handlersForEventType.push(handler)

    this.eventHandlers.set(eventType, handlersForEventType)
  }

  publish(event: InternalEventInterface): void {
    const handlersForEventType = this.eventHandlers.get(event.type)
    if (handlersForEventType === undefined) {
      return
    }

    for (const handlerForEventType of handlersForEventType) {
      void handlerForEventType.handleEvent(event)
    }
  }

  async publishSync(event: InternalEventInterface, strategy: InternalEventPublishStrategy): Promise<void> {
    const handlersForEventType = this.eventHandlers.get(event.type)
    if (handlersForEventType === undefined) {
      return
    }

    if (strategy === InternalEventPublishStrategy.SEQUENCE) {
      for (const handlerForEventType of handlersForEventType) {
        await handlerForEventType.handleEvent(event)
      }
    }

    if (strategy === InternalEventPublishStrategy.ASYNC) {
      const handlerPromises = []
      for (const handlerForEventType of handlersForEventType) {
        handlerPromises.push(handlerForEventType.handleEvent(event))
      }

      await Promise.all(handlerPromises)
    }
  }
}
