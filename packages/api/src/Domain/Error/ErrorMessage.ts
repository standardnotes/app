export enum ErrorMessage {
  RegistrationInProgress = 'An existing registration request is already in progress.',
  GenericRegistrationFail = 'A server error occurred while trying to register. Please try again.',
  RateLimited = 'Too many successive server requests. Please wait a few minutes and try again.',
  InsufficientPasswordMessage = 'Your password must be at least %LENGTH% characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.',
  PasscodeRequired = 'Your passcode is required in order to register for an account.',
  GenericInProgress = 'An existing request is already in progress.',
  GenericFail = 'A server error occurred. Please try again.',
}
