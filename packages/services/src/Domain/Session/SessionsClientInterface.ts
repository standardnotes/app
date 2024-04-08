import { UserRegistrationResponseBody } from '@standardnotes/api'
import { SNRootKey } from '@standardnotes/encryption'
import { RootKeyInterface, ProtocolVersion } from '@standardnotes/models'
import {
  SessionBody,
  SignInResponse,
  User,
  HttpResponse,
  SessionListEntry,
  SessionListResponse,
} from '@standardnotes/responses'
import { Base64String } from '@standardnotes/sncrypto-common'

import { SessionManagerResponse } from './SessionManagerResponse'

export interface SessionsClientInterface {
  getWorkspaceDisplayIdentifier(): string
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>

  getUser(): User | undefined
  isSignedIn(): boolean
  isSignedOut(): boolean
  get userUuid(): string
  getSureUser(): User
  isSignedIntoFirstPartyServer(): boolean

  getSessionsList(): Promise<HttpResponse<SessionListEntry[]>>
  refreshSessionIfExpiringSoon(): Promise<boolean>
  revokeSession(sessionId: string): Promise<HttpResponse<SessionListResponse>>
  revokeAllOtherSessions(): Promise<void>

  isCurrentSessionReadOnly(): boolean | undefined
  register(email: string, password: string, hvmToken: string, ephemeral: boolean): Promise<UserRegistrationResponseBody>
  signIn(
    email: string,
    password: string,
    strict: boolean,
    ephemeral: boolean,
    minAllowedVersion?: ProtocolVersion,
    hvmToken?: string,
  ): Promise<SessionManagerResponse>
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

  getPublicKey(): string
  getSigningPublicKey(): string
  isUserMissingKeyPair(): boolean
}
