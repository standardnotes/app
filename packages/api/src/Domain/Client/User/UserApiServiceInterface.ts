import { RootKeyParamsInterface } from '@standardnotes/models'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'

export interface UserApiServiceInterface {
  register(registerDTO: {
    email: string
    serverPassword: string
    keyParams: RootKeyParamsInterface
    ephemeral: boolean
    pkcPublicKey: string
    pkcEncryptedPrivateKey: string
  }): Promise<UserRegistrationResponse>
}
