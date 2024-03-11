import {
  DeleteSettingResponse,
  GetSettingResponse,
  HttpResponse,
  ListSettingsResponse,
  UpdateSettingResponse,
} from '@standardnotes/responses'
import { UuidString } from '@Lib/Types/UuidString'

export interface SettingsServerInterface {
  listSettings(userUuid: UuidString): Promise<HttpResponse<ListSettingsResponse>>

  updateSetting(
    userUuid: UuidString,
    settingName: string,
    settingValue: string,
    sensitive: boolean,
  ): Promise<HttpResponse<UpdateSettingResponse>>

  getSetting(userUuid: UuidString, settingName: string): Promise<HttpResponse<GetSettingResponse>>

  getSubscriptionSetting(userUuid: UuidString, settingName: string): Promise<HttpResponse<GetSettingResponse>>

  updateSubscriptionSetting(
    userUuid: UuidString,
    settingName: string,
    settingValue: string,
    sensitive: boolean,
  ): Promise<HttpResponse<UpdateSettingResponse>>

  deleteSetting(userUuid: UuidString, settingName: string): Promise<HttpResponse<DeleteSettingResponse>>
}
