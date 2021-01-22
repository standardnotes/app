import { ApplicationEvent } from '@standardnotes/snjs';
import { WebApplication } from '@/ui_models/application';

export type CtrlState = Partial<Record<string, any>>
export type CtrlProps = Partial<Record<string, any>>

export class PureViewCtrl<P = CtrlProps, S = CtrlState> {
  $timeout: ng.ITimeoutService
  /** Passed through templates */
  application!: WebApplication
  state: S = {} as any
  private unsubApp: any
  private unsubState: any
  private stateTimeout?: ng.IPromise<void>
  /**
   * Subclasses can optionally add an ng-if=ctrl.templateReady to make sure that
   * no Angular handlebars/syntax render in the UI before display data is ready.
   */
  protected templateReady = false

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService,
    public props: P = {} as any
  ) {
    this.$timeout = $timeout;
  }

  $onInit() {
    this.state = {
      ...this.getInitialState(),
      ...this.state,
    }
    this.addAppEventObserver();
    this.addAppStateObserver();
    this.templateReady = true;
  }

  deinit() {
    this.unsubApp();
    this.unsubState();
    this.unsubApp = undefined;
    this.unsubState = undefined;
    if (this.stateTimeout) {
      this.$timeout.cancel(this.stateTimeout);
    }
  }

  $onDestroy() {
    this.deinit();
  }

  public get appState() {
    return this.application!.getAppState();
  }

  /** @private */
  async resetState() {
    this.state = this.getInitialState();
    await this.setState(this.state);
  }

  /** @override */
  getInitialState(): S {
    return {} as any;
  }

  async setState(state: Partial<S>) {
    if (!this.$timeout) {
      return;
    }
    return new Promise<void>((resolve) => {
      this.stateTimeout = this.$timeout(() => {
        /**
         * State changes must be *inside* the timeout block for them to be affected in the UI
         * Otherwise UI controllers will need to use $timeout everywhere
         */
        this.state = Object.freeze(Object.assign({}, this.state, state));
        resolve();
        this.afterStateChange();
      });
    });
  }

  /** @override */
  afterStateChange() {
  }

  /** @returns a promise that resolves after the UI has been updated. */
  flushUI() {
    return this.$timeout();
  }

  initProps(props: CtrlProps) {
    if (Object.keys(this.props).length > 0) {
      throw 'Already init-ed props.';
    }
    this.props = Object.freeze(Object.assign({}, this.props, props));
  }

  addAppStateObserver() {
    this.unsubState = this.application!.getAppState().addObserver(
      async (eventName, data) => {
        this.onAppStateEvent(eventName, data);
      }
    );
  }

  onAppStateEvent(eventName: any, data: any) {
    /** Optional override */
  }

  addAppEventObserver() {
    if (this.application!.isStarted()) {
      this.onAppStart();
    }
    if (this.application!.isLaunched()) {
      this.onAppLaunch();
    }
    this.unsubApp = this.application!.addEventObserver(async (eventName) => {
      this.onAppEvent(eventName);
      if (eventName === ApplicationEvent.Started) {
        await this.onAppStart();
      } else if (eventName === ApplicationEvent.Launched) {
        await this.onAppLaunch();
      } else if (eventName === ApplicationEvent.CompletedIncrementalSync) {
        this.onAppIncrementalSync();
      } else if (eventName === ApplicationEvent.CompletedFullSync) {
        this.onAppFullSync();
      } else if (eventName === ApplicationEvent.KeyStatusChanged) {
        this.onAppKeyChange();
      } else if (eventName === ApplicationEvent.LocalDataLoaded) {
        this.onLocalDataLoaded();
      }
    });
  }

  onAppEvent(eventName: ApplicationEvent) {
    /** Optional override */
  }

  /** @override */
  async onAppStart() {
    await this.resetState();
  }

  onLocalDataLoaded() {
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
