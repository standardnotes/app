import { HttpResponse } from '../Http/HttpResponse'
import { RegistrationData } from './RegistrationData'

export type RegistrationResponse = HttpResponse & {
  data: RegistrationData
}
