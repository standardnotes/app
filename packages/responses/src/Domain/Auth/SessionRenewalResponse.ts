import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { SessionRenewalData } from './SessionRenewalData'

export type SessionRenewalResponse = DeprecatedHttpResponse & {
  data: SessionRenewalData
}
