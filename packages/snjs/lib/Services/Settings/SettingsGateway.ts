import { SettingsList } from './SettingsList'
import { API_MESSAGE_INVALID_SESSION } from '@standardnotes/services'
import { getErrorFromErrorResponse, HttpStatusCode, isErrorResponse, User } from '@standardnotes/responses'
import { SettingsServerInterface } from './SettingsServerInterface'
import { SettingName } from '@standardnotes/domain-core'

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
    const response = await this.settingsApi.listSettings(this.userUuid)

    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }

    if (response.data == undefined || response.data.settings == undefined) {
      return new SettingsList([])
    }

    const settings: SettingsList = new SettingsList(response.data.settings)
    return settings
  }

  async getSetting(name: SettingName): Promise<string | undefined> {
    const response = await this.settingsApi.getSetting(this.userUuid, name.value)

    if (response.status === HttpStatusCode.BadRequest) {
      return undefined
    }

    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }

    return response?.data?.setting?.value ?? undefined
  }

  async getSubscriptionSetting(name: SettingName): Promise<string | undefined> {
    if (!name.isASubscriptionSetting()) {
      throw new Error(`Setting ${name.value} is not a subscription setting`)
    }

    const response = await this.settingsApi.getSubscriptionSetting(this.userUuid, name.value)

    if (response.status === HttpStatusCode.BadRequest) {
      return undefined
    }

    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }

    return response?.data?.setting?.value ?? undefined
  }

  async updateSubscriptionSetting(name: SettingName, payload: string, sensitive: boolean): Promise<void> {
    const response = await this.settingsApi.updateSubscriptionSetting(this.userUuid, name.value, payload, sensitive)
    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }
  }

  async getDoesSensitiveSettingExist(name: SettingName): Promise<boolean> {
    if (!name.isSensitive()) {
      throw new Error(`Setting ${name.value} is not sensitive`)
    }

    const response = await this.settingsApi.getSetting(this.userUuid, name.value)

    if (response.status === HttpStatusCode.BadRequest) {
      return false
    }

    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }

    return response.data?.success ?? false
  }

  async updateSetting(name: SettingName, payload: string, sensitive: boolean): Promise<void> {
    const response = await this.settingsApi.updateSetting(this.userUuid, name.value, payload, sensitive)
    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }
  }

  async deleteSetting(name: SettingName): Promise<void> {
    const response = await this.settingsApi.deleteSetting(this.userUuid, name.value)
    if (isErrorResponse(response)) {
      throw new Error(getErrorFromErrorResponse(response).message)
    }
  }

  deinit() {
    ;(this.settingsApi as unknown) = undefined
    ;(this.userProvider as unknown) = undefined
  }
}
