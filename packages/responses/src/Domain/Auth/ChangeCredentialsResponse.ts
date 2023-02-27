import { HttpResponse } from '../Http/HttpResponse'
import { ChangeCredentialsData } from './ChangeCredentialsData'

export type ChangeCredentialsResponse = HttpResponse & {
  data: ChangeCredentialsData
}
