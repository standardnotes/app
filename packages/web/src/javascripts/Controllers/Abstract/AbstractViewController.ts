import { CrossControllerEvent } from '../CrossControllerEvent'
import { InternalEventBus, InternalEventPublishStrategy, removeFromArray } from '@standardnotes/snjs'
import { WebApplication } from '../../Application/Application'
import { Disposer } from '@/Types/Disposer'

type ControllerEventObserver<Event = void, EventData = void> = (event: Event, data: EventData) => void

export abstract class AbstractViewController<Event = void, EventData = void> {
  dealloced = false
  protected disposers: Disposer[] = []
  private eventObservers: ControllerEventObserver<Event, EventData>[] = []

  constructor(public application: WebApplication, protected eventBus: InternalEventBus) {}

  protected async publishCrossControllerEventSync(name: CrossControllerEvent, data?: unknown): Promise<void> {
    await this.eventBus.publishSync({ type: name, payload: data }, InternalEventPublishStrategy.SEQUENCE)
  }

  deinit(): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined
    ;(this.eventBus as unknown) = undefined

    for (const disposer of this.disposers) {
      disposer()
    }

    ;(this.disposers as unknown) = undefined

    this.eventObservers.length = 0
  }

  addEventObserver(observer: ControllerEventObserver<Event, EventData>): () => void {
    this.eventObservers.push(observer)

    return () => {
      removeFromArray(this.eventObservers, observer)
    }
  }

  protected notifyEvent(event: Event, data: EventData): void {
    this.eventObservers.forEach((observer) => observer(event, data))
  }
}
