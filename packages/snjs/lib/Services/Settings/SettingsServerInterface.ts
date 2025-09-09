import {
  DeleteSettingResponse,
  GetSettingResponse,
  HttpResponse,
  ListSettingsResponse,
  UpdateSettingResponse,
} from '@standardnotes/responses'
import { UuidString } from '@Lib/Types/UuidString'

export interface MfaSecretResponse {
  secret: string
}

export interface SettingsServerInterface {
  listSettings(userUuid: UuidString): Promise<HttpResponse<ListSettingsResponse>>

  updateSetting(
    userUuid: UuidString,
    settingName: string,
    settingValue: string,
    sensitive: boolean,
    totpToken?: string,
  ): Promise<HttpResponse<UpdateSettingResponse>>

  getSetting(
    userUuid: UuidString,
    settingName: string,
    serverPassword?: string,
  ): Promise<HttpResponse<GetSettingResponse>>

  getSubscriptionSetting(userUuid: UuidString, settingName: string): Promise<HttpResponse<GetSettingResponse>>

  updateSubscriptionSetting(
    userUuid: UuidString,
    settingName: string,
    settingValue: string,
    sensitive: boolean,
  ): Promise<HttpResponse<UpdateSettingResponse>>

  getMfaSecret(userUuid: UuidString): Promise<HttpResponse<MfaSecretResponse>>

  deleteSetting(
    userUuid: UuidString,
    settingName: string,
    serverPassword?: string,
  ): Promise<HttpResponse<DeleteSettingResponse>>
}
