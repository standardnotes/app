import { AuthClientInterface, EncryptionService } from '@standardnotes/services'
import { Result, SettingName, UseCaseInterface } from '@standardnotes/domain-core'

import { SettingsClientInterface } from '@Lib/Services/Settings/SettingsClientInterface'
import { GetRecoveryCodesDTO } from './GetRecoveryCodesDTO'
import { SNRootKeyParams } from '@standardnotes/encryption'

export class GetRecoveryCodes implements UseCaseInterface<string> {
  constructor(
    private authClient: AuthClientInterface,
    private settingsClient: SettingsClientInterface,
    private encryption: EncryptionService,
  ) {}

  async execute(dto: GetRecoveryCodesDTO): Promise<Result<string>> {
    if (!dto.password) {
      return Result.fail('Password is required to get recovery code.')
    }
    const currentRootKey = await this.encryption.computeRootKey(
      dto.password,
      this.encryption.getRootKeyParams() as SNRootKeyParams,
    )
    const serverPassword = currentRootKey.serverPassword

    if (!serverPassword) {
      return Result.fail('Could not compute server password')
    }

    const existingRecoveryCodes = await this.settingsClient.getSetting(
      SettingName.create(SettingName.NAMES.RecoveryCodes).getValue(),
      serverPassword,
    )
    if (existingRecoveryCodes !== undefined) {
      return Result.ok(existingRecoveryCodes)
    }

    const generatedRecoveryCodes = await this.authClient.generateRecoveryCodes({ serverPassword })
    if (generatedRecoveryCodes === false) {
      return Result.fail('Could not generate recovery code')
    }

    return Result.ok(generatedRecoveryCodes)
  }
}
