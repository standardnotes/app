import { SettingsService } from '../Settings'
import { PureCryptoInterface } from '@standardnotes/sncrypto-common'
import { FeaturesService } from '../Features/FeaturesService'
import {
  AbstractService,
  InternalEventBusInterface,
  MfaServiceInterface,
  ProtectionsClientInterface,
  SignInStrings,
} from '@standardnotes/services'
import { SettingName } from '@standardnotes/domain-core'

export class MfaService extends AbstractService implements MfaServiceInterface {
  constructor(
    private settingsService: SettingsService,
    private crypto: PureCryptoInterface,
    private featuresService: FeaturesService,
    private protections: ProtectionsClientInterface,
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
    if (!(await this.protections.authorizeMfaDisable())) {
      return
    }

    return await this.settingsService.deleteSetting(SettingName.create(SettingName.NAMES.MfaSecret).getValue())
  }

  override deinit(): void {
    ;(this.settingsService as unknown) = undefined
    ;(this.crypto as unknown) = undefined
    ;(this.featuresService as unknown) = undefined
    super.deinit()
  }
}
