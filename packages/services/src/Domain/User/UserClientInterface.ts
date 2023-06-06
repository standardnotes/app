import { Base64String } from '@standardnotes/sncrypto-common'
import { Either, UserRequestType } from '@standardnotes/common'
import { DeinitSource } from '../Application/DeinitSource'
import { UserRegistrationResponseBody } from '@standardnotes/api'
import { HttpError, HttpResponse, SignInResponse } from '@standardnotes/responses'
import { AbstractService } from '../Service/AbstractService'

export type CredentialsChangeFunctionResponse = { error?: HttpError }

export enum AccountEvent {
  SignedInOrRegistered = 'SignedInOrRegistered',
  SignedOut = 'SignedOut',
}

export interface SignedInOrRegisteredEventPayload {
  ephemeral: boolean
  mergeLocal: boolean
  awaitSync: boolean
  checkIntegrity: boolean
}

export interface SignedOutEventPayload {
  source: DeinitSource
}

export interface AccountEventData {
  payload: Either<SignedInOrRegisteredEventPayload, SignedOutEventPayload>
}

export interface UserClientInterface extends AbstractService<AccountEvent, AccountEventData> {
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
