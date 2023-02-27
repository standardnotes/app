import { DeprecatedMinimalHttpResponse } from '../Http/DeprecatedMinimalHttpResponses'
import { SettingData } from './SettingData'

export type ListSettingsResponse = DeprecatedMinimalHttpResponse & {
  data?: {
    settings?: SettingData[]
  }
}
