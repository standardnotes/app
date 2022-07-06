import { AnyKeyParamsContent, ContentType } from '@standardnotes/common'
import { HttpResponse } from '../Http/HttpResponse'
import { ServerItemResponse } from '../Item/ServerItemResponse'

export type ActionResponse = HttpResponse & {
  description: string
  supported_types: ContentType[]
  deprecation?: string
  actions: unknown[]
  item?: ServerItemResponse
  keyParams?: AnyKeyParamsContent
  auth_params?: AnyKeyParamsContent
}
