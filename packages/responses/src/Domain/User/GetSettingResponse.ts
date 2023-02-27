import { HttpResponse } from '../Http/HttpResponse'
import { SettingData } from './SettingData'

export type GetSettingResponse = HttpResponse & {
  data?: {
    success?: boolean
    setting?: SettingData
  }
}
