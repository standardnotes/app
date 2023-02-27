import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { ListedAccountInfo } from './ListedAccountInfo'

export type ListedAccountInfoResponse = DeprecatedHttpResponse & {
  data: ListedAccountInfo
}
