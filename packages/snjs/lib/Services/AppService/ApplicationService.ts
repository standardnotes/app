import {
  AbstractService,
  ApplicationEvent,
  ApplicationInterface,
  InternalEventBusInterface,
} from '@standardnotes/services'

export class ApplicationService extends AbstractService {
  private unsubApp!: () => void

  constructor(
    protected application: ApplicationInterface,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
    this.addAppEventObserverAfterSubclassesFinishConstructing()
  }

  override deinit() {
    ;(this.application as unknown) = undefined

    this.unsubApp()
    ;(this.unsubApp as unknown) = undefined

    super.deinit()
  }

  addAppEventObserverAfterSubclassesFinishConstructing() {
    setTimeout(() => {
      this.addAppEventObserver()
    }, 0)
  }

  addAppEventObserver() {
    if (this.application.isStarted()) {
      void this.onAppStart()
    }
    if (this.application.isLaunched()) {
      void this.onAppLaunch()
    }

    this.unsubApp = this.application.addEventObserver(async (event: ApplicationEvent) => {
      await this.onAppEvent(event)
      if (event === ApplicationEvent.Started) {
        void this.onAppStart()
      } else if (event === ApplicationEvent.Launched) {
        void this.onAppLaunch()
      } else if (event === ApplicationEvent.CompletedFullSync) {
        this.onAppFullSync()
      } else if (event === ApplicationEvent.CompletedIncrementalSync) {
        this.onAppIncrementalSync()
      } else if (event === ApplicationEvent.KeyStatusChanged) {
        void this.onAppKeyChange()
      }
    })
  }

  async onAppEvent(_event: ApplicationEvent) {
    /** Optional override */
  }

  async onAppStart() {
    /** Optional override */
  }

  async onAppLaunch() {
    /** Optional override */
  }

  async onAppKeyChange() {
    /** Optional override */
  }

  onAppIncrementalSync() {
    /** Optional override */
  }

  onAppFullSync() {
    /** Optional override */
  }
}
