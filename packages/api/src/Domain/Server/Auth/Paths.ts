const SessionPaths = {
  refreshSession: '/v1/sessions/refresh',
}

const RecoveryPaths = {
  generateRecoveryCodes: '/v1/auth/recovery/codes',
  recoveryKeyParams: '/v1/auth/recovery/login-params',
  signInWithRecoveryCodes: '/v1/auth/recovery/login',
}

export const Paths = {
  v1: {
    ...SessionPaths,
    ...RecoveryPaths,
  },
}
