import { HttpResponse } from '../Http/HttpResponse'

export type ListedRegistrationResponse = HttpResponse & {
  data?: unknown
}
