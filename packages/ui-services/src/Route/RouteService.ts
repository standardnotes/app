import {
  AbstractService,
  ApplicationEvent,
  ApplicationInterface,
  InternalEventBusInterface,
} from '@standardnotes/services'
import { RouteParser } from './RouteParser'
import { RouteParserInterface } from './RouteParserInterface'
import { RouteServiceEvent } from './RouteServiceEvent'

export class RouteService extends AbstractService<RouteServiceEvent, RouteParserInterface> {
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

  public getRoute(): RouteParserInterface {
    return new RouteParser(window.location.href)
  }

  public removeSettingsFromURLQueryParameters() {
    const urlSearchParams = new URLSearchParams(window.location.search)
    urlSearchParams.delete('settings')

    const newUrl = `${window.location.origin}${window.location.pathname}${urlSearchParams.toString()}`
    window.history.replaceState(null, document.title, newUrl)
  }

  private addAppEventObserver() {
    this.unsubApp = this.application.addEventObserver(async (event: ApplicationEvent) => {
      if (event === ApplicationEvent.LocalDataLoaded) {
        void this.notifyRouteChange()
      }
    })
  }

  private notifyRouteChange() {
    void this.notifyEvent(RouteServiceEvent.RouteChanged, this.getRoute())
  }
}
