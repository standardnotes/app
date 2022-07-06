import { HttpResponse } from '../Http/HttpResponse'
import { ListedAccountInfo } from './ListedAccountInfo'

export type ListedAccountInfoResponse = HttpResponse & {
  data: ListedAccountInfo
}
