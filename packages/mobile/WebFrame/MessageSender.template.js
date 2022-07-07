// eslint-disable-next-line @typescript-eslint/no-unused-vars
class WebProcessMessageSender {
  constructor() {
    this.pendingMessages = []
    window.addEventListener('message', this.handleMessageFromReactNative)
  }

  handleMessageFromReactNative(message) {
    try {
      const parsed = JSON.parse(message)
      const { messageId, returnValue } = parsed
      const pendingMessage = this.pendingMessages.find((m) => m.messageId === messageId)
      pendingMessage.resolve(returnValue)
      this.pendingMessages.splice(this.pendingMessages.indexOf(pendingMessage), 1)
    } catch (error) {
      console.log('Error parsing message from React Native')
    }
  }

  sendMessage(functionName, args) {
    const messageId = Math.random()
    window.ReactNativeWebView.postMessage({ functionName: functionName, args: args, messageId })
    return new Promise((resolve) => {
      this.pendingMessages.push({
        messageId,
        resolve,
      })
    })
  }
}
