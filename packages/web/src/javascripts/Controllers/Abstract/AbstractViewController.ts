import { CrossControllerEvent } from '../CrossControllerEvent'
import { InternalEventBus, InternalEventPublishStrategy } from '@standardnotes/snjs'
import { WebApplication } from '../../Application/Application'
import { Disposer } from '@/Types/Disposer'
import { Persistable } from './Persistable'

export abstract class AbstractViewController<T> implements Persistable<T> {
  dealloced = false
  protected disposers: Disposer[] = []

  constructor(public application: WebApplication, protected eventBus: InternalEventBus) {}

  getPersistableValue(): T {
    throw new Error('Method not implemented.')
  }

  hydrateFromPersistedValue(value: T): void {
    throw new Error('Method not implemented.')
  }

  protected async publishEventSync(name: CrossControllerEvent): Promise<void> {
    await this.eventBus.publishSync({ type: name, payload: undefined }, InternalEventPublishStrategy.SEQUENCE)
  }

  deinit(): void {
    this.dealloced = true
    ;(this.application as unknown) = undefined
    ;(this.eventBus as unknown) = undefined

    for (const disposer of this.disposers) {
      disposer()
    }

    ;(this.disposers as unknown) = undefined
  }
}
