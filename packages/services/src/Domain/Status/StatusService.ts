import { removeFromArray } from '@standardnotes/utils'
import { AbstractService } from '../Service/AbstractService'
import { StatusServiceEvent, StatusServiceInterface, StatusMessageIdentifier } from './StatusServiceInterface'

/* istanbul ignore file */

export class StatusService extends AbstractService<StatusServiceEvent, string> implements StatusServiceInterface {
  private _message = ''
  private directSetMessage?: string
  private dynamicMessages: string[] = []

  get message(): string {
    return this._message
  }

  setMessage(message: string | undefined): void {
    this.directSetMessage = message
    this.recomputeMessage()
  }

  addMessage(message: string): StatusMessageIdentifier {
    this.dynamicMessages.push(message)

    this.recomputeMessage()

    return message
  }

  removeMessage(message: StatusMessageIdentifier): void {
    removeFromArray(this.dynamicMessages, message)

    this.recomputeMessage()
  }

  private recomputeMessage(): void {
    const messages = [...this.dynamicMessages]

    if (this.directSetMessage) {
      messages.unshift(this.directSetMessage)
    }

    this._message = this.messageFromArray(messages)

    void this.notifyEvent(StatusServiceEvent.MessageChanged, this._message)
  }

  private messageFromArray(messages: string[]): string {
    let message = ''

    messages.forEach((value, index) => {
      const isLast = index === messages.length - 1

      message += value

      if (!isLast) {
        message += ', '
      }
    })

    return message
  }
}
