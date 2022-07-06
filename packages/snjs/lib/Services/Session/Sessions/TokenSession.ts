import { SessionBody, SessionRenewalResponse } from '@standardnotes/responses'
import { Session } from './Session'

/** For protocol versions >= 004 */
export class TokenSession extends Session {
  static FromApiResponse(response: SessionRenewalResponse) {
    const body = response.data.session as SessionBody
    const accessToken: string = body.access_token
    const refreshToken: string = body.refresh_token
    const accessExpiration: number = body.access_expiration
    const refreshExpiration: number = body.refresh_expiration
    const readonlyAccess: boolean = body.readonly_access

    return new TokenSession(accessToken, accessExpiration, refreshToken, refreshExpiration, readonlyAccess)
  }

  constructor(
    public accessToken: string,
    public accessExpiration: number,
    public refreshToken: string,
    public refreshExpiration: number,
    private readonlyAccess: boolean,
  ) {
    super()
  }

  isReadOnly() {
    return this.readonlyAccess
  }

  private getExpireAt() {
    return this.accessExpiration || 0
  }

  public get authorizationValue() {
    return this.accessToken
  }

  public canExpire() {
    return true
  }

  public isExpired() {
    return this.getExpireAt() < Date.now()
  }
}
