import { ClientDisplayableError, User } from '@standardnotes/responses'
import { Base64String } from '@standardnotes/sncrypto-common'

export interface SessionsClientInterface {
  createDemoShareToken(): Promise<Base64String | ClientDisplayableError>
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  getUser(): User | undefined
}
