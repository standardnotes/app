import { removeFromArray } from '@standardnotes/utils'
import { AbstractService } from '../Service/AbstractService'
import { StatusServiceEvent, StatusServiceInterface, StatusMessageIdentifier } from './StatusServiceInterface'
import { PreferencePaneId } from '../Preferences/PreferenceId'

/* istanbul ignore file */

export class StatusService extends AbstractService<StatusServiceEvent, string> implements StatusServiceInterface {
  private preferencesBubbleCounts: Record<PreferencePaneId, number> = {
    general: 0,
    account: 0,
    security: 0,
    'home-server': 0,
    vaults: 0,
    appearance: 0,
    backups: 0,
    listed: 0,
    shortcuts: 0,
    plugins: 0,
    accessibility: 0,
    'get-free-month': 0,
    'help-feedback': 0,
    'whats-new': 0,
  }

  getPreferencesBubbleCount(preferencePaneId: PreferencePaneId): number {
    return this.preferencesBubbleCounts[preferencePaneId]
  }

  setPreferencesBubbleCount(preferencePaneId: PreferencePaneId, count: number): void {
    this.preferencesBubbleCounts[preferencePaneId] = count
    const totalCount = this.totalPreferencesBubbleCount
    void this.notifyEvent(
      StatusServiceEvent.PreferencesBubbleCountChanged,
      totalCount > 0 ? totalCount.toString() : undefined,
    )
  }

  get totalPreferencesBubbleCount(): number {
    return Object.values(this.preferencesBubbleCounts).reduce((total, count) => total + count, 0)
  }

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
