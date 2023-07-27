import { Result, UseCaseInterface } from '@standardnotes/domain-core'
import { PkcKeyPair } from '@standardnotes/sncrypto-common'
import { ReuploadAllInvites } from '../../VaultInvite/UseCase/ReuploadAllInvites'
import { ResendAllMessages } from '../../AsymmetricMessage/UseCase/ResendAllMessages'

export class HandleKeyPairChange implements UseCaseInterface<void> {
  constructor(private reuploadAllInvites: ReuploadAllInvites, private resendAllMessages: ResendAllMessages) {}

  async execute(dto: {
    newKeys: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
    previousKeys?: {
      encryption: PkcKeyPair
      signing: PkcKeyPair
    }
  }): Promise<Result<void>> {
    await this.reuploadAllInvites.execute({
      keys: dto.newKeys,
      previousKeys: dto.previousKeys,
    })

    await this.resendAllMessages.execute({
      keys: dto.newKeys,
      previousKeys: dto.previousKeys,
    })

    return Result.ok()
  }
}
