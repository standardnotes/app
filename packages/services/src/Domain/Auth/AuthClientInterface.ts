import { AnyKeyParamsContent } from '@standardnotes/common'
import { SessionBody } from '@standardnotes/responses'

export interface AuthClientInterface {
  generateRecoveryCodes(): Promise<string | false>
  recoveryKeyParams(dto: {
    username: string
    codeChallenge: string
    recoveryCodes: string
  }): Promise<AnyKeyParamsContent | false>
  signInWithRecoveryCodes(dto: {
    username: string
    password: string
    codeVerifier: string
    recoveryCodes: string
  }): Promise<
    | {
        keyParams: AnyKeyParamsContent
        session: SessionBody
        user: {
          uuid: string
          email: string
          protocolVersion: string
        }
      }
    | false
  >
}
