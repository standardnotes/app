import { HttpResponse } from '../Http/HttpResponse'
import { SessionRenewalData } from './SessionRenewalData'

export type SessionRenewalResponse = HttpResponse & {
  data: SessionRenewalData
}
