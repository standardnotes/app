import { HttpSuccessResponse } from '../Http/HttpResponse'
import { SettingData } from './SettingData'

export type GetSettingResponse = HttpSuccessResponse<{
  success?: boolean
  setting?: SettingData
}>
