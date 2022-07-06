import { RootKeyParamsInterface } from '@standardnotes/models'
import { UserRegistrationResponse } from '../../Response/User/UserRegistrationResponse'

export interface UserApiServiceInterface {
  register(
    email: string,
    serverPassword: string,
    keyParams: RootKeyParamsInterface,
    ephemeral: boolean,
  ): Promise<UserRegistrationResponse>
}
