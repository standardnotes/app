import { DeprecatedHttpResponse } from '../Http/DeprecatedHttpResponse'
import { SignInData } from './SignInData'

export type SignInResponse = DeprecatedHttpResponse & {
  data: SignInData
}
