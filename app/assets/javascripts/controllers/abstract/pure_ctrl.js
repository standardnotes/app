import { ApplicationEvents } from 'snjs';

export class PureCtrl {
  /* @ngInject */
  constructor($timeout) {
    if(!$timeout) {
      throw Error('$timeout must not be null');
    }
    this.$timeout = $timeout;
    this.props = {};
    this.state = {};
    /* Allow caller constructor to finish setting instance variables */
    setImmediate(() => {
      this.state = this.getInitialState();
    });
  }
  
  $onInit() {
    this.addAppEventObserver();
    this.addAppStateObserver();
  }

  deinit() {
    this.unsubApp();
    this.unsubState();
    this.unsubApp = null;
    this.unsubState = null;
    this.application = null;
    if (this.stateTimeout) {
      this.$timeout.cancel(this.stateTimeout);
    }
  }

  $onDestroy() {
    this.deinit();
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

  async setState(state) {
    if(!this.$timeout) {
      return;
    }
    return new Promise((resolve) => {
      this.stateTimeout = this.$timeout(() => {
        this.state = Object.freeze(Object.assign({}, this.state, state));
        resolve();
      });
    });
  }

  initProps(props) {
    if (Object.keys(this.props).length > 0) {
      throw 'Already init-ed props.';
    }
    this.props = Object.freeze(Object.assign({}, this.props, props));
  }

  addAppStateObserver() {
    this.unsubState = this.application.getAppState().addObserver((eventName, data) => {
      this.onAppStateEvent(eventName, data);
    });
  }

  onAppStateEvent(eventName, data) {
    /** Optional override */
  }

  addAppEventObserver() {
    if (this.application.isStarted()) {
      this.onAppStart();
    }
    if (this.application.isLaunched()) {
      this.onAppLaunch();
    }
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
      this.onAppEvent(eventName);
      if (eventName === ApplicationEvents.Started) {
        await this.onAppStart();
      } else if (eventName === ApplicationEvents.Launched) {
        await this.onAppLaunch();
      } else if (eventName === ApplicationEvents.CompletedSync) {
        this.onAppSync();
      } else if (eventName === ApplicationEvents.KeyStatusChanged) {
        this.onAppKeyChange();
      }
    });
  }

  onAppEvent(eventName) {
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

  onAppSync() {
    /** Optional override */
  }

}