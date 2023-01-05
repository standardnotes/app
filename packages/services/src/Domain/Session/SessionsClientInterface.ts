import { UserRegistrationResponseBody } from '@standardnotes/api'
import { ProtocolVersion } from '@standardnotes/common'
import { SNRootKey } from '@standardnotes/encryption'
import { RootKeyInterface } from '@standardnotes/models'
import { ClientDisplayableError, HttpResponse, SessionBody, SignInResponse, User } from '@standardnotes/responses'
import { Base64String } from '@standardnotes/sncrypto-common'

import { SessionManagerResponse } from './SessionManagerResponse'

export interface SessionsClientInterface {
  createDemoShareToken(): Promise<Base64String | ClientDisplayableError>
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  getUser(): User | undefined
  register(email: string, password: string, ephemeral: boolean): Promise<UserRegistrationResponseBody>
  signIn(
    email: string,
    password: string,
    strict: boolean,
    ephemeral: boolean,
    minAllowedVersion?: ProtocolVersion,
  ): Promise<SessionManagerResponse>
  getSureUser(): User
  bypassChecksAndSignInWithRootKey(
    email: string,
    rootKey: RootKeyInterface,
    ephemeral: boolean,
  ): Promise<SignInResponse | HttpResponse>
  signOut(): Promise<void>
  changeCredentials(parameters: {
    currentServerPassword: string
    newRootKey: RootKeyInterface
    wrappingKey?: RootKeyInterface
    newEmail?: string
  }): Promise<SessionManagerResponse>
  handleAuthentication(dto: {
    session: SessionBody
    user: {
      uuid: string
      email: string
    }
    rootKey: SNRootKey
    wrappingKey?: SNRootKey
  }): Promise<void>
}
