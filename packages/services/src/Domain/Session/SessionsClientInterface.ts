import { UserRegistrationResponseBody } from '@standardnotes/api'
import { ProtocolVersion } from '@standardnotes/common'
import { SNRootKey } from '@standardnotes/encryption'
import { RootKeyInterface } from '@standardnotes/models'
import { SessionBody, SignInResponse, User, HttpResponse } from '@standardnotes/responses'
import { Base64String } from '@standardnotes/sncrypto-common'

import { SessionManagerResponse } from './SessionManagerResponse'

export interface SessionsClientInterface {
  getWorkspaceDisplayIdentifier(): string
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  getUser(): User | undefined
  isCurrentSessionReadOnly(): boolean | undefined
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
  ): Promise<HttpResponse<SignInResponse>>
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
