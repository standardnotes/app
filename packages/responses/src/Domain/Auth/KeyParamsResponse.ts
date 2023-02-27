import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { KeyParamsData } from './KeyParamsData'

export type KeyParamsResponse = DeprecatedHttpResponse & {
  data: KeyParamsData
}
