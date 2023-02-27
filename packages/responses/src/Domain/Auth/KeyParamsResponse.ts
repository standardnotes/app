import { HttpResponse } from '../Http/HttpResponse'
import { KeyParamsData } from './KeyParamsData'

export type KeyParamsResponse = HttpResponse & {
  data: KeyParamsData
}
