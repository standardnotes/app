import { HttpSuccessResponse } from '../Http/HttpResponse'
import { SignInData } from './SignInData'

export type SignInResponse = HttpSuccessResponse<SignInData>
