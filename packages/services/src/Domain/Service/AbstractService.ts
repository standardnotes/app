/* istanbul ignore file */

import { removeFromArray } from '@standardnotes/utils'
import { EventObserver } from '../Event/EventObserver'
import { ApplicationServiceInterface } from './ApplicationServiceInterface'
import { InternalEventBusInterface } from '../Internal/InternalEventBusInterface'
import { InternalEventPublishStrategy } from '../Internal/InternalEventPublishStrategy'
import { DiagnosticInfo } from '../Diagnostics/ServiceDiagnostics'

export abstract class AbstractService<EventName = string, EventData = unknown>
  implements ApplicationServiceInterface<EventName, EventData>
{
  private eventObservers: EventObserver<EventName, EventData>[] = []
  public loggingEnabled = false
  private criticalPromises: Promise<unknown>[] = []

  protected eventDisposers: (() => void)[] = []

  constructor(protected internalEventBus: InternalEventBusInterface) {}

  public addEventObserver(observer: EventObserver<EventName, EventData>): () => void {
    this.eventObservers.push(observer)

    const thislessEventObservers = this.eventObservers
    return () => {
      removeFromArray(thislessEventObservers, observer)
    }
  }

  protected async notifyEvent(eventName: EventName, data?: EventData): Promise<void> {
    for (const observer of this.eventObservers) {
      await observer(eventName, data)
    }

    this.internalEventBus?.publish({
      type: eventName as unknown as string,
      payload: data,
    })
  }

  protected async notifyEventSync(eventName: EventName, data?: EventData): Promise<void> {
    for (const observer of this.eventObservers) {
      await observer(eventName, data)
    }

    await this.internalEventBus?.publishSync(
      {
        type: eventName as unknown as string,
        payload: data,
      },
      InternalEventPublishStrategy.SEQUENCE,
    )
  }

  getDiagnostics(): Promise<DiagnosticInfo | undefined> {
    return Promise.resolve(undefined)
  }

  /**
   * Called by application to allow services to momentarily block deinit until
   * sensitive operations complete.
   */
  public async blockDeinit(): Promise<void> {
    await Promise.all(this.criticalPromises)
  }

  /**
   * Called by application before restart.
   * Subclasses should deregister any observers/timers
   */
  public deinit(): void {
    this.eventObservers.length = 0
    ;(this.internalEventBus as unknown) = undefined
    ;(this.criticalPromises as unknown) = undefined

    for (const disposer of this.eventDisposers) {
      disposer()
    }
    this.eventDisposers = []
  }

  /**
   * A critical function is one that should block signing out or destroying application
   * session until the crticial function has completed. For example, persisting keys to
   * disk is a critical operation, and should be wrapped in this function call. The
   * parent application instance will await all criticial functions via the `blockDeinit`
   * function before signing out and deiniting.
   */
  protected async executeCriticalFunction<T = void>(func: () => Promise<T>): Promise<T> {
    const promise = func()
    this.criticalPromises.push(promise)
    return promise
  }

  getServiceName(): string {
    return this.constructor.name
  }

  isApplicationService(): true {
    return true
  }
}
