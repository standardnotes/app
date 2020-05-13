import { ApplicationEvent } from 'snjs';
import { WebApplication } from '@/ui_models/application';

export type CtrlState = Partial<Record<string, any>>
export type CtrlProps = Partial<Record<string, any>>

export class PureViewCtrl {
  $timeout: ng.ITimeoutService
  /** Passed through templates */
  application!: WebApplication
  props: CtrlProps = {}
  state: CtrlState = {}
  private unsubApp: any
  private unsubState: any
  private stateTimeout: any

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    this.$timeout = $timeout;
  }

  $onInit() {
    this.state = {
      ...this.getInitialState(),
      ...this.state,
    }
    this.addAppEventObserver();
    this.addAppStateObserver();
  }

  deinit() {
    this.unsubApp();
    this.unsubState();
    this.unsubApp = undefined;
    this.unsubState = undefined;
    (this.application as any) = undefined;
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
  getInitialState() {
    return {};
  }

  async setState(state: CtrlState) {
    if (!this.$timeout) {
      return;
    }
    return new Promise((resolve) => {
      this.stateTimeout = this.$timeout(() => {
        this.state = Object.freeze(Object.assign({}, this.state, state));
        resolve();
      });
    });
  }

  async updateUI(func: () => void) {
    this.$timeout(func);
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
      }  else if (eventName === ApplicationEvent.CompletedFullSync) {
        this.onAppFullSync();
      } else if (eventName === ApplicationEvent.KeyStatusChanged) {
        this.onAppKeyChange();
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
