import { SettingName } from '@standardnotes/settings'

import { SNSettingsService } from '../Settings'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { SNFeaturesService } from '../Features/FeaturesService'
import { AbstractService, InternalEventBusInterface, SignInStrings } from '@standardnotes/services'

export class SNMfaService extends AbstractService {
  constructor(
    private settingsService: SNSettingsService,
    private crypto: PureCryptoInterface,
    private featuresService: SNFeaturesService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  private async saveMfaSetting(secret: string): Promise<void> {
    return await this.settingsService.updateSetting(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
      secret,
      true,
    )
  }

  async isMfaActivated(): Promise<boolean> {
    const mfaSetting = await this.settingsService.getDoesSensitiveSettingExist(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
    )
    return mfaSetting != false
  }

  async generateMfaSecret(): Promise<string> {
    return this.crypto.generateOtpSecret()
  }

  async getOtpToken(secret: string): Promise<string> {
    return this.crypto.totpToken(secret, Date.now(), 6, 30)
  }

  async enableMfa(secret: string, otpToken: string): Promise<void> {
    const otpTokenValid = otpToken != undefined && otpToken === (await this.getOtpToken(secret))

    if (!otpTokenValid) {
      throw new Error(SignInStrings.IncorrectMfa)
    }

    return this.saveMfaSetting(secret)
  }

  async disableMfa(): Promise<void> {
    return await this.settingsService.deleteSetting(SettingName.create(SettingName.NAMES.MfaSecret).getValue())
  }

  override deinit(): void {
    ;(this.settingsService as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.featuresService as unknown) = undefined
    super.deinit()
  }
}
