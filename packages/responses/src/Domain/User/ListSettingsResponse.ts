import { HttpSuccessResponse } from '../Http/HttpResponse'
import { SettingData } from './SettingData'

export type ListSettingsResponse = HttpSuccessResponse<{
  settings?: SettingData[]
}>
