import { Base64String } from '@standardnotes/sncrypto-common'
import { KeyParamsOrigination, UserRequestType } from '@standardnotes/common'
import { DeinitSource } from '../Application/DeinitSource'
import { UserRegistrationResponseBody } from '@standardnotes/api'
import { HttpResponse, SignInResponse, User } from '@standardnotes/responses'
import { AbstractService } from '../Service/AbstractService'
import { AccountEventData } from './AccountEventData'
import { AccountEvent } from './AccountEvent'
import { CredentialsChangeFunctionResponse } from './CredentialsChangeFunctionResponse'

export interface UserServiceInterface extends AbstractService<AccountEvent, AccountEventData> {
  get user(): User | undefined
  get sureUser(): User
  getUserUuid(): string
  isSignedIn(): boolean

  addPasscode(passcode: string): Promise<boolean>
  removePasscode(): Promise<boolean>
  changePasscode(newPasscode: string, origination?: KeyParamsOrigination): Promise<boolean>

  register(
    email: string,
    password: string,
    hvmToken: string,
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
    hvmToken?: string,
  ): Promise<HttpResponse<SignInResponse>>
  deleteAccount(): Promise<{
    error: boolean
    message?: string
  }>
  changeCredentials(parameters: {
    currentPassword: string
    origination: KeyParamsOrigination
    validateNewPasswordStrength: boolean
    newEmail?: string
    newPassword?: string
    passcode?: string
  }): Promise<CredentialsChangeFunctionResponse>

  signOut(force?: boolean, source?: DeinitSource): Promise<void>
  submitUserRequest(requestType: UserRequestType): Promise<boolean>
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  updateAccountWithFirstTimeKeyPair(): Promise<{
    success?: true
    canceled?: true
    error?: { message: string }
  }>
  performProtocolUpgrade(): Promise<{
    success?: true
    canceled?: true
    error?: { message: string }
  }>
}
