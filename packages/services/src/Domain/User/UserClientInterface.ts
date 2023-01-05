import { Base64String } from '@standardnotes/sncrypto-common'
import { UserRequestType } from '@standardnotes/common'
import { DeinitSource } from '../Application/DeinitSource'

export interface UserClientInterface {
  deleteAccount(): Promise<{
    error: boolean
    message?: string
  }>
  signOut(force?: boolean, source?: DeinitSource): Promise<void>
  submitUserRequest(requestType: UserRequestType): Promise<boolean>
  populateSessionFromDemoShareToken(token: Base64String): Promise<void>
  handleSignIn(): Promise<void>
}
