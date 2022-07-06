import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { SettingData } from './SettingData'

export type ListSettingsResponse = MinimalHttpResponse & {
  data?: {
    settings?: SettingData[]
  }
}
