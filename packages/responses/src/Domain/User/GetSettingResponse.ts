import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { SettingData } from './SettingData'

export type GetSettingResponse = DeprecatedMinimalHttpResponse & {
  data?: {
    success?: boolean
    setting?: SettingData
  }
}
