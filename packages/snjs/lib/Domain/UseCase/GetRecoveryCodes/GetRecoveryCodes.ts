import { AuthClientInterface } from '@standardnotes/services'
import { Result, SettingName, UseCaseInterface } from '@standardnotes/domain-core'

import { SettingsClientInterface } from '@Lib/Services/Settings/SettingsClientInterface'

export class GetRecoveryCodes implements UseCaseInterface<string> {
  constructor(
    private authClient: AuthClientInterface,
    private settingsClient: SettingsClientInterface,
  ) {}

  async execute(): Promise<Result<string>> {
    const existingRecoveryCodes = await this.settingsClient.getSetting(
      SettingName.create(SettingName.NAMES.RecoveryCodes).getValue(),
    )
    if (existingRecoveryCodes !== undefined) {
      return Result.ok(existingRecoveryCodes)
    }

    const generatedRecoveryCodes = await this.authClient.generateRecoveryCodes()
    if (generatedRecoveryCodes === false) {
      return Result.fail('Could not generate recovery code')
    }

    return Result.ok(generatedRecoveryCodes)
  }
}
