import { SNApiService } from '../Api/ApiService'
import { SettingsGateway } from './SettingsGateway'
import { SNSessionManager } from '../Session/SessionManager'
import { EmailBackupFrequency, SettingName } from '@standardnotes/settings'
import { AbstractService, InternalEventBusInterface } from '@standardnotes/services'
import { SettingsClientInterface } from './SettingsClientInterface'

export class SNSettingsService extends AbstractService implements SettingsClientInterface {
  private provider!: SettingsGateway
  private frequencyOptionsLabels = {
    [EmailBackupFrequency.Disabled]: 'No email backups',
    [EmailBackupFrequency.Daily]: 'Daily',
    [EmailBackupFrequency.Weekly]: 'Weekly',
  }

  constructor(
    private readonly sessionManager: SNSessionManager,
    private readonly apiService: SNApiService,
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

  async updateSetting(name: SettingName, payload: string, sensitive = false) {
    return this.provider.updateSetting(name, payload, sensitive)
  }

  async getDoesSensitiveSettingExist(name: SettingName) {
    return this.provider.getDoesSensitiveSettingExist(name)
  }

  async deleteSetting(name: SettingName) {
    return this.provider.deleteSetting(name)
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
