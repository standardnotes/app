import { Session } from './Session'

/** Legacy, for protocol versions <= 003 */

export class JwtSession extends Session {
  public jwt: string

  constructor(jwt: string) {
    super()
    this.jwt = jwt
  }

  public get authorizationValue(): string {
    return this.jwt
  }

  public canExpire(): false {
    return false
  }
}
