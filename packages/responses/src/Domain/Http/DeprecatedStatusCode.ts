export enum DeprecatedStatusCode {
  LocalValidationError = 10,
  CanceledMfa = 11,

  HttpStatusMinSuccess = 200,
  HttpStatusNoContent = 204,
  HttpStatusMaxSuccess = 299,
  /** The session's access token is expired, but the refresh token is valid */
  HttpStatusExpiredAccessToken = 498,
  /** The session's access token and refresh token are expired, user must reauthenticate */
  HttpStatusInvalidSession = 401,
  /** User's IP is rate-limited. */
  HttpStatusForbidden = 403,
  HttpBadRequest = 400,
}
