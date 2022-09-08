// eslint-disable-next-line @typescript-eslint/no-unused-vars
class WebProcessDeviceInterface {
  constructor(messageSender) {
    this.appVersion = '1.2.3'
    this.environment = 4
    this.databases = []
    this.messageSender = messageSender
  }

  setApplication() {}

  sendMessage(functionName, args) {
    return this.messageSender.sendMessage(functionName, args)
  }
}
