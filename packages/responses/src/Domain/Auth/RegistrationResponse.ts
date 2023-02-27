import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { RegistrationData } from './RegistrationData'

export type RegistrationResponse = DeprecatedHttpResponse & {
  data: RegistrationData
}
