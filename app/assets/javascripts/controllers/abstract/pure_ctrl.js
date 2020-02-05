export class PureCtrl {
  constructor(
    $timeout
  ) {
    if(!$timeout) {
      throw 'Invalid PureCtrl construction.';
    }
    this.$timeout = $timeout;
    this.state = {};
    this.props = {};
  }

  async setState(state) {
    return new Promise((resolve) => {
      this.$timeout(() => {
        const previousState = this.state;
        this.state = Object.freeze(Object.assign({}, this.state, state));
        this.afterStateChanged(previousState);
        resolve();
      });
    });
  }

  afterStateChanged(prevState) {
    // Exposed to descendants of this class
  }

  initProps(props) {
    if (Object.keys(this.props).length > 0) {
      throw 'Already init-ed props.';
    }
    this.props = Object.freeze(Object.assign({}, this.props, props));
  }
}