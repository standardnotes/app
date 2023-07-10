import { Base64String } from '@standardnotes/sncrypto-common'
import { UserRequestType } from '@standardnotes/common'
import { DeinitSource } from '../Application/DeinitSource'
import { UserRegistrationResponseBody } from '@standardnotes/api'
import { HttpResponse, SignInResponse } from '@standardnotes/responses'
import { AbstractService } from '../Service/AbstractService'
import { AccountEventData } from './AccountEventData'
import { AccountEvent } from './AccountEvent'

export interface UserClientInterface extends AbstractService<AccountEvent, AccountEventData> {
  getUserUuid(): string
  isSignedIn(): boolean
  register(
    email: string,
    password: string,
    ephemeral: boolean,
    mergeLocal: boolean,
  ): Promise<UserRegistrationResponseBody>
  signIn(
    email: string,
    password: string,
    strict: boolean,
    ephemeral: boolean,
    mergeLocal: boolean,
    awaitSync: boolean,
  ): Promise<HttpResponse<SignInResponse>>
  deleteAccount(): Promise<{
    error: boolean
    message?: string
  }>
  signOut(force?: boolean, source?: DeinitSource): Promise<void>
  submitUserRequest(requestType: UserRequestType): Promise<boolean>
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  updateAccountWithFirstTimeKeyPair(): Promise<{
    success?: true
    canceled?: true
    error?: { message: string }
  }>
}
