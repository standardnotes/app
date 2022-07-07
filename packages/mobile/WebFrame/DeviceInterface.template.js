// eslint-disable-next-line @typescript-eslint/no-unused-vars
class WebProcessDeviceInterface {
  constructor(messageSender, functions) {
    this.appVersion = '1.2.3'
    this.environment = 1
    this.databases = []
    this.messageSender = messageSender
    Object.assign(this, functions)
  }

  setApplication() {}

  sendMessage(functionName, args) {
    return this.messageSender.sendMessage(functionName, args)
  }
}
