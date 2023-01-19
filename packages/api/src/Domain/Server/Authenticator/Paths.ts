const AuthenticatorPaths = {
  listAuthenticators: '/v1/authenticators',
  deleteAuthenticator: (authenticatorId: string) => `/v1/authenticators/${authenticatorId}`,
  generateRegistrationOptions: '/v1/authenticators/generate-registration-options',
  verifyRegistrationResponse: '/v1/authenticators/verify-registration',
  generateAuthenticationOptions: '/v1/authenticators/generate-authentication-options',
}

export const Paths = {
  v1: {
    ...AuthenticatorPaths,
  },
}
