import { HttpResponse } from '../Http/HttpResponse'
import { SignInData } from './SignInData'

export type SignInResponse = HttpResponse & {
  data: SignInData
}
