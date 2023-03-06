import { AddAuthenticator } from './AddAuthenticator/AddAuthenticator'
import { GetRecoveryCodes } from './GetRecoveryCodes/GetRecoveryCodes'
import { SignInWithRecoveryCodes } from './SignInWithRecoveryCodes/SignInWithRecoveryCodes'
import { ListAuthenticators } from './ListAuthenticators/ListAuthenticators'
import { DeleteAuthenticator } from './DeleteAuthenticator/DeleteAuthenticator'
import { GetAuthenticatorAuthenticationResponse } from './GetAuthenticatorAuthenticationResponse/GetAuthenticatorAuthenticationResponse'
import { ListRevisions } from './ListRevisions/ListRevisions'
import { GetRevision } from './GetRevision/GetRevision'
import { DeleteRevision } from './DeleteRevision/DeleteRevision'

export interface UseCaseContainerInterface {
  get signInWithRecoveryCodes(): SignInWithRecoveryCodes
  get getRecoveryCodes(): GetRecoveryCodes
  get addAuthenticator(): AddAuthenticator
  get listAuthenticators(): ListAuthenticators
  get deleteAuthenticator(): DeleteAuthenticator
  get getAuthenticatorAuthenticationResponse(): GetAuthenticatorAuthenticationResponse
  get listRevisions(): ListRevisions
  get getRevision(): GetRevision
  get deleteRevision(): DeleteRevision
}
