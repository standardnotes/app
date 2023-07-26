import { AsymmetricMessageServerHash, isErrorResponse } from '@standardnotes/responses'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { AsymmetricMessageServerInterface } from '@standardnotes/api'
import { ResendMessage } from './ResendMessage'
import { FindContact } from '../../Contacts/UseCase/FindContact'

export class ResendAllMessages implements UseCaseInterface<void> {
  constructor(
    private resendMessage: ResendMessage,
    private messageServer: AsymmetricMessageServerInterface,
    private findContact: FindContact,
  ) {}

  async execute(params: {
    keys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    previousKeys?: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
  }): Promise<Result<AsymmetricMessageServerHash[]>> {
    const messages = await this.messageServer.getOutboundUserMessages()

    if (isErrorResponse(messages)) {
      return Result.fail('Failed to get outbound user messages')
    }

    const errors: string[] = []

    for (const message of messages.data.messages) {
      const recipient = this.findContact.execute({ userUuid: message.user_uuid })
      if (recipient.isFailed()) {
        errors.push(`Contact not found for invite ${message.user_uuid}`)
        continue
      }

      await this.resendMessage.execute({
        keys: params.keys,
        previousKeys: params.previousKeys,
        message: message,
        recipient: recipient.getValue(),
      })

      await this.messageServer.deleteMessage({
        messageUuid: message.uuid,
      })
    }

    if (errors.length > 0) {
      return Result.fail(errors.join(', '))
    }

    return Result.ok()
  }
}
