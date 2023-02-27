import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { ChangeCredentialsData } from './ChangeCredentialsData'

export type ChangeCredentialsResponse = DeprecatedHttpResponse & {
  data: ChangeCredentialsData
}
