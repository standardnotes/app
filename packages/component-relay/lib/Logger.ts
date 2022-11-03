const noop = () => undefined

export default class Logger {
  static enabled = false

  private static get isSupported() {
    return window.console || console ? true : false
  }

  static get info(): any {
    if (!Logger.isSupported || !this.enabled) {
      return noop
    }
    return console.log.bind(console)
  }

  static get error(): any {
    if (!Logger.isSupported) {
      return noop
    }
    return console.error.bind(console)
  }
}
