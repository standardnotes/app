// eslint-disable-next-line @typescript-eslint/no-unused-vars
class WebProcessMessageSender {
  constructor() {
    this.pendingMessages = []
    window.addEventListener('message', this.handleMessageFromReactNative.bind(this))
    document.addEventListener('message', this.handleMessageFromReactNative.bind(this))
  }

  handleMessageFromReactNative(event) {
    const message = event.data
    try {
      const parsed = JSON.parse(message)
      const { messageId, returnValue } = parsed
      const pendingMessage = this.pendingMessages.find((m) => m.messageId === messageId)
      pendingMessage.resolve(returnValue)
      this.pendingMessages.splice(this.pendingMessages.indexOf(pendingMessage), 1)
    } catch (error) {
      console.log('Error parsing message from React Native', message, error)
    }
  }

  sendMessage(functionName, args) {
    const messageId = Math.random()
    window.ReactNativeWebView.postMessage(JSON.stringify({ functionName: functionName, args: args, messageId }))
    return new Promise((resolve) => {
      this.pendingMessages.push({
        messageId,
        resolve,
      })
    })
  }
}
