export abstract class Session {
  public abstract canExpire(): boolean

  /** Return the token that should be included in the header of authorized network requests */
  public abstract get authorizationValue(): string
}
