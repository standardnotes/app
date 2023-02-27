import { HttpResponse } from '../Http/HttpResponse'
import { SettingData } from './SettingData'

export type ListSettingsResponse = HttpResponse & {
  data?: {
    settings?: SettingData[]
  }
}
