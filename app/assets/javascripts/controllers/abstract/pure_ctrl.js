import { ApplicationService } from 'snjs';

export class PureCtrl extends ApplicationService {
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
    super(application);
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.appState = appState;
    this.props = {};
    /* Allow caller constructor to finish setting instance variables */
    setImmediate(() => {
      this.state = this.getInitialState();
    });
    $scope.$on('$destroy', () => {
      this.unsubState();
      this.deinit();
    });
  }

  $onInit() {
    this.addAppStateObserver();
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

  onAppStateEvent(eventName, data) {
    /** Optional override */
  }

  /** @override */
  async onAppStart() {
    await this.resetState();
    return super.onAppStart();
  }
}