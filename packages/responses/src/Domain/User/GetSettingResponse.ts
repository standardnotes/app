import { MinimalHttpResponse } from '../Http/MinimalHttpResponses'
import { SettingData } from './SettingData'

export type GetSettingResponse = MinimalHttpResponse & {
  data?: {
    success?: boolean
    setting?: SettingData
  }
}
