import { SettingsList } from './SettingsList'
import { SettingName, SensitiveSettingName, SubscriptionSettingName } from '@standardnotes/settings'
import { API_MESSAGE_INVALID_SESSION } from '@standardnotes/services'
import { HttpStatusCode, User } from '@standardnotes/responses'
import { SettingsServerInterface } from './SettingsServerInterface'

/**
 * SettingsGateway coordinates communication with the API service
 * wrapping the userUuid provision for simpler consumption
 */
export class SettingsGateway {
  constructor(
    private readonly settingsApi: SettingsServerInterface,
    private readonly userProvider: { getUser: () => User | undefined },
  ) {}

  isReadyForModification(): boolean {
    return this.getUser() != undefined
  }

  private getUser() {
    return this.userProvider.getUser()
  }

  private get userUuid() {
    const user = this.getUser()
    if (user == undefined || user.uuid == undefined) {
      throw new Error(API_MESSAGE_INVALID_SESSION)
    }
    return user.uuid
  }

  async listSettings() {
    const { data } = await this.settingsApi.listSettings(this.userUuid)

    if (data?.error != undefined) {
      throw new Error(data?.error.message)
    }

    if (data == undefined || data.settings == undefined) {
      return new SettingsList([])
    }

    const settings: SettingsList = new SettingsList(data.settings)
    return settings
  }

  async getSetting(name: SettingName): Promise<string | undefined> {
    const response = await this.settingsApi.getSetting(this.userUuid, name)

    // Backend responds with 400 when setting doesn't exist
    if (response.status === HttpStatusCode.BadRequest) {
      return undefined
    }

    if (response.data?.error != undefined) {
      throw new Error(response.data?.error.message)
    }

    return response?.data?.setting?.value ?? undefined
  }

  async getSubscriptionSetting(name: SubscriptionSettingName): Promise<string | undefined> {
    const response = await this.settingsApi.getSubscriptionSetting(this.userUuid, name)

    if (response.status === HttpStatusCode.BadRequest) {
      return undefined
    }

    if (response.data?.error != undefined) {
      throw new Error(response.data?.error.message)
    }

    return response?.data?.setting?.value ?? undefined
  }

  async getDoesSensitiveSettingExist(name: SensitiveSettingName): Promise<boolean> {
    const response = await this.settingsApi.getSetting(this.userUuid, name)

    // Backend responds with 400 when setting doesn't exist
    if (response.status === HttpStatusCode.BadRequest) {
      return false
    }

    if (response.data?.error != undefined) {
      throw new Error(response.data?.error.message)
    }

    return response.data?.success ?? false
  }

  async updateSetting(name: SettingName, payload: string, sensitive: boolean): Promise<void> {
    const { data } = await this.settingsApi.updateSetting(this.userUuid, name, payload, sensitive)
    if (data?.error != undefined) {
      throw new Error(data?.error.message)
    }
  }

  async deleteSetting(name: SettingName): Promise<void> {
    const { data } = await this.settingsApi.deleteSetting(this.userUuid, name)
    if (data?.error != undefined) {
      throw new Error(data?.error.message)
    }
  }

  deinit() {
    ;(this.settingsApi as unknown) = undefined
    ;(this.userProvider as unknown) = undefined
  }
}
