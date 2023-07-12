import { AnyKeyParamsContent } from '@standardnotes/common'
import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { ServerItemResponse } from '../Item/ServerItemResponse'

export type ActionResponse = DeprecatedHttpResponse & {
  description: string
  supported_types: string[]
  deprecation?: string
  actions: unknown[]
  item?: ServerItemResponse
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
}
