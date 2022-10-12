import {
  AbstractService,
  ApplicationEvent,
  ApplicationInterface,
  InternalEventBusInterface,
} from '@standardnotes/services'
import { RouteParser } from './RouteParser'
import { RouteServiceEvent } from './RouteServiceEvent'

export class RouteService extends AbstractService<RouteServiceEvent, RouteParser> {
  private unsubApp!: () => void

  constructor(
    private application: ApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.addAppEventObserver()
  }

  override deinit() {
    super.deinit()
    ;(this.application as unknown) = undefined
    this.unsubApp()
  }

  getRoute(): RouteParser {
    return new RouteParser(window.location.href)
  }

  private addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (event: ApplicationEvent) => {
      if (event === ApplicationEvent.LocalDataLoaded) {
        void this.notifyRouteChange()
      }
    })
  }

  private notifyRouteChange() {
    this.notifyEvent(RouteServiceEvent.RouteChanged, this.getRoute())
  }
}
