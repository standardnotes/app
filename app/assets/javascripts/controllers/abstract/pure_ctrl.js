export class PureCtrl {
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
    this.state = {};
    this.props = {};
    this.addAppStateObserver();
    this.addAppEventObserver();
    $scope.$on('$destroy', () => {
      this.unsubApp();
      this.unsubState();
    });
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
    this.unsubApp = this.application.addEventObserver((eventName) => {
      this.onApplicationEvent(eventName);
    });
  }

  onApplicationEvent(eventName) {
    /** Optional override */
  }

  onAppStateEvent(eventName, data) {
    /** Optional override */
  }

}