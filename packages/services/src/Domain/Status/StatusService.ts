import { removeFromArray } from '@standardnotes/utils'
import { AbstractService } from '../Service/AbstractService'
import { StatusServiceEvent, StatusServiceInterface, StatusMessageIdentifier } from './StatusServiceInterface'
import { PreferencePaneId } from '../Preferences/PreferenceId'

/* istanbul ignore file */

export class StatusService extends AbstractService<StatusServiceEvent, string> implements StatusServiceInterface {
  private preferencesBubbleCounts: Record<PreferencePaneId, number> = {
    [PreferencePaneId.General]: 0,
    [PreferencePaneId.Account]: 0,
    [PreferencePaneId.Security]: 0,
    [PreferencePaneId.HomeServer]: 0,
    [PreferencePaneId.Vaults]: 0,
    [PreferencePaneId.Appearance]: 0,
    [PreferencePaneId.Backups]: 0,
    [PreferencePaneId.Listed]: 0,
    [PreferencePaneId.Shortcuts]: 0,
    [PreferencePaneId.Plugins]: 0,
    [PreferencePaneId.Accessibility]: 0,
    [PreferencePaneId.GetFreeMonth]: 0,
    [PreferencePaneId.HelpFeedback]: 0,
    [PreferencePaneId.WhatsNew]: 0,
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
