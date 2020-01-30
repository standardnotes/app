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
        this.state = Object.freeze(Object.assign({}, this.state, state));
        resolve();
      })
    })
  }

  initProps(props) {
    if (Object.keys(this.props).length > 0) {
      throw 'Already init-ed props.';
    }
    this.props = Object.freeze(Object.assign({}, this.props, props));
  }
}