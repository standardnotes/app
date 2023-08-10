import { AbstractService, InternalEventBusInterface, ApplicationEvent } from '@standardnotes/services'
import { AbstractUIServiceInterface } from './AbstractUIServiceInterface'
import { WebApplicationInterface } from '../WebApplication/WebApplicationInterface'

export class AbstractUIService<EventName = string, EventData = unknown>
  extends AbstractService<EventName, EventData>
  implements AbstractUIServiceInterface<EventName, EventData>
{
  private unsubApp!: () => void
  private observers = new Set<() => void>()

  constructor(
    protected application: WebApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.addAppEventObserverAfterSubclassesFinishConstructing()
  }

  async onAppStart() {
    return
  }

  async onAppEvent(_event: ApplicationEvent) {
    return
  }

  private addAppEventObserverAfterSubclassesFinishConstructing() {
    setTimeout(() => {
      this.addAppEventObserver()
    }, 0)
  }

  private addAppEventObserver() {
    if (this.application.isStarted()) {
      void this.onAppStart()
    }

    this.unsubApp = this.application.addEventObserver(async (event: ApplicationEvent) => {
      await this.onAppEvent(event)
      if (event === ApplicationEvent.Started) {
        void this.onAppStart()
      }
    })
  }

  addObserver(observer: () => void): void {
    this.observers.add(observer)
  }

  override deinit() {
    ;(this.application as unknown) = undefined
    this.observers.forEach((unsubObserver) => unsubObserver())
    this.unsubApp()
    ;(this.unsubApp as unknown) = undefined
    super.deinit()
  }
}
