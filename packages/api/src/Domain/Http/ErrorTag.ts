export enum ErrorTag {
  MfaInvalid = 'mfa-invalid',
  MfaRequired = 'mfa-required',
  RefreshTokenInvalid = 'invalid-refresh-token',
  RefreshTokenExpired = 'expired-refresh-token',
  AccessTokenExpired = 'expired-access-token',
  ParametersInvalid = 'invalid-parameters',
  RevokedSession = 'revoked-session',
  AuthInvalid = 'invalid-auth',
  ReadOnlyAccess = 'read-only-access',
}
