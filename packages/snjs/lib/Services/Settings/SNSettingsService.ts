import { LegacyApiService } from '../Api/ApiService'
import { SettingsGateway } from './SettingsGateway'
import { SessionManager } from '../Session/SessionManager'
import { EmailBackupFrequency } from '@standardnotes/settings'
import { AbstractService, InternalEventBusInterface } from '@standardnotes/services'
import { SettingsClientInterface } from './SettingsClientInterface'
import { SettingName } from '@standardnotes/domain-core'

export class SettingsService extends AbstractService implements SettingsClientInterface {
  private provider!: SettingsGateway
  private frequencyOptionsLabels = {
    [EmailBackupFrequency.Disabled]: 'No email backups',
    [EmailBackupFrequency.Daily]: 'Daily',
    [EmailBackupFrequency.Weekly]: 'Weekly',
  }

  constructor(
    private readonly sessionManager: SessionManager,
    private readonly apiService: LegacyApiService,
    protected override internalEventBus: InternalEventBusInterface,
  ) {
    super(internalEventBus)
  }

  initializeFromDisk(): void {
    this.provider = new SettingsGateway(this.apiService, this.sessionManager)
  }

  async listSettings() {
    return this.provider.listSettings()
  }

  async getSetting(name: SettingName) {
    return this.provider.getSetting(name)
  }

  async getSubscriptionSetting(name: SettingName) {
    return this.provider.getSubscriptionSetting(name)
  }

  async updateSubscriptionSetting(name: SettingName, payload: string, sensitive = false) {
    return this.provider.updateSubscriptionSetting(name, payload, sensitive)
  }

  async updateSetting(name: SettingName, payload: string, sensitive = false, totpToken?: string) {
    return this.provider.updateSetting(name, payload, sensitive, totpToken)
  }

  async getDoesSensitiveSettingExist(name: SettingName) {
    return this.provider.getDoesSensitiveSettingExist(name)
  }

  async deleteSetting(name: SettingName) {
    return this.provider.deleteSetting(name)
  }

  async generateMfaSecret(): Promise<string> {
    return this.provider.getMfaSecret()
  }

  async updateMfaSetting(secret: string, totpToken: string): Promise<void> {
    return this.provider.updateSetting(
      SettingName.create(SettingName.NAMES.MfaSecret).getValue(),
      secret,
      true,
      totpToken,
    )
  }

  getEmailBackupFrequencyOptionLabel(frequency: EmailBackupFrequency): string {
    return this.frequencyOptionsLabels[frequency]
  }

  override deinit(): void {
    this.provider?.deinit()
    ;(this.provider as unknown) = undefined
    ;(this.sessionManager as unknown) = undefined
    ;(this.apiService as unknown) = undefined
  }
}
