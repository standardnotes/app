import { ApplicationEvents } from 'snjs';
export class PureCtrl {
  /* @ngInject */
  constructor(
    $scope,
    $timeout,
    application,
    appState
  ) {
    if (!$scope || !$timeout || !application || !appState) {
      throw 'Invalid PureCtrl construction.';
    }
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.appState = appState;
    this.application = application;
    this.state = this.getInitialState();
    this.props = {};
    $scope.$on('$destroy', () => {
      this.unsubApp();
      this.unsubState();
    });
  }

  $onInit() {
    this.addAppStateObserver();
    this.addAppEventObserver();
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
    return new Promise((resolve) => {
      this.$timeout(() => {
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
    this.unsubState = this.appState.addObserver((eventName, data) => {
      this.onAppStateEvent(eventName, data);
    });
  }

  addAppEventObserver() {
    if (this.application.isStarted()) {
      this.onAppStart();
    }
    if (!this.appState.isLocked()) {
      this.onAppLaunch();
    }
    this.unsubApp = this.application.addEventObserver(async (eventName) => {
      this.onAppEvent(eventName);
      if (eventName === ApplicationEvents.Started) {
        await this.resetState();
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

  onAppStateEvent(eventName, data) {
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

  onAppSync() {
    /** Optional override */
  }
}