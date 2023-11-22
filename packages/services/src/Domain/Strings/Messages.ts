import { ProtocolVersion } from '@standardnotes/models'

export const API_MESSAGE_GENERIC_INVALID_LOGIN = 'A server error occurred while trying to sign in. Please try again.'
export const API_MESSAGE_GENERIC_REGISTRATION_FAIL =
  'A server error occurred while trying to register. Please try again.'
export const API_MESSAGE_GENERIC_CHANGE_CREDENTIALS_FAIL =
  'Something went wrong while changing your credentials. Your credentials were not changed. Please try again.'
export const API_MESSAGE_GENERIC_SYNC_FAIL = 'Could not connect to server.'

export const ServerErrorStrings = {
  DeleteAccountError: 'Your account was unable to be deleted due to an error. Please try your request again.',
}

export const API_MESSAGE_GENERIC_INTEGRITY_CHECK_FAIL = 'Could not check your data integrity with the server.'

export const API_MESSAGE_GENERIC_SINGLE_ITEM_SYNC_FAIL = 'Could not retrieve item.'

export const API_MESSAGE_REGISTRATION_IN_PROGRESS = 'An existing registration request is already in progress.'
export const API_MESSAGE_LOGIN_IN_PROGRESS = 'An existing sign in request is already in progress.'
export const API_MESSAGE_CHANGE_CREDENTIALS_IN_PROGRESS =
  'An existing change credentials request is already in progress.'

export const API_MESSAGE_FALLBACK_LOGIN_FAIL = 'Invalid email or password.'

export const API_MESSAGE_GENERIC_TOKEN_REFRESH_FAIL =
  'A server error occurred while trying to refresh your session. Please try again.'

export const API_MESSAGE_TOKEN_REFRESH_IN_PROGRESS =
  'Your account session is being renewed with the server. Please try your request again.'

export const API_MESSAGE_RATE_LIMITED = 'Too many successive server requests. Please wait a few minutes and try again.'

export const API_MESSAGE_INVALID_SESSION = 'Please sign in to an account in order to continue with your request.'

export const API_MESSAGE_FAILED_GET_SETTINGS = 'Failed to get settings.'
export const API_MESSAGE_FAILED_UPDATE_SETTINGS = 'Failed to update settings.'
export const API_MESSAGE_FAILED_LISTED_REGISTRATION = 'Unable to register for Listed. Please try again later.'

export const API_MESSAGE_FAILED_CREATE_FILE_TOKEN = 'Failed to create file token.'

export const API_MESSAGE_FAILED_SUBSCRIPTION_INFO = "Failed to get subscription's information."

export const API_MESSAGE_FAILED_ACCESS_PURCHASE = 'Failed to access purchase flow.'

export const API_MESSAGE_FAILED_OFFLINE_FEATURES = 'Failed to get offline features.'
export const API_MESSAGE_UNTRUSTED_EXTENSIONS_WARNING = `The extension you are attempting to install comes from an
  untrusted source. Untrusted extensions may lower the security of your data. Do you want to continue?`
export const API_MESSAGE_FAILED_DOWNLOADING_EXTENSION = `Error downloading package details. Please check the
  extension link and try again.`
export const API_MESSAGE_FAILED_OFFLINE_ACTIVATION =
  'An unknown issue occurred during offline activation. Please download your activation code again and try once more.'

export const INVALID_EXTENSION_URL = 'Invalid extension URL.'

export const UNSUPPORTED_PROTOCOL_VERSION =
  'This version of the application does not support your newer account type. Please upgrade to the latest version of Standard Notes to sign in.'

export const EXPIRED_PROTOCOL_VERSION =
  'The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.com/help/security for more information.'

export const UNSUPPORTED_KEY_DERIVATION =
  'Your account was created on a platform with higher security capabilities than this browser supports. If we attempted to generate your login keys here, it would take hours. Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to log in.'

export const INVALID_PASSWORD_COST =
  'Unable to sign in due to insecure password parameters. Please visit standardnotes.com/help/security for more information.'
export const INVALID_PASSWORD = 'Invalid password.'

export const OUTDATED_PROTOCOL_ALERT_IGNORE = 'Sign In'
export const UPGRADING_ENCRYPTION = "Upgrading your account's encryption version…"

export const SETTING_PASSCODE = 'Setting passcode…'
export const CHANGING_PASSCODE = 'Changing passcode…'
export const REMOVING_PASSCODE = 'Removing passcode…'

export const DO_NOT_CLOSE_APPLICATION = 'Do not close the application until this process completes.'

export const UNKNOWN_ERROR = 'Unknown error.'

export function InsufficientPasswordMessage(minimum: number): string {
  return `Your password must be at least ${minimum} characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.`
}

export function StrictSignInFailed(current: ProtocolVersion, latest: ProtocolVersion): string {
  return `Strict Sign In has refused the server's sign-in parameters. The latest account version is ${latest}, but the server is reporting a version of ${current} for your account. If you'd like to proceed with sign in anyway, please disable Strict Sign In and try again.`
}

export const CredentialsChangeStrings = {
  PasscodeRequired: 'Your passcode is required to process your credentials change.',
  Failed: 'Unable to change your credentials due to a sync error. Please try again.',
}

export const RegisterStrings = {
  PasscodeRequired: 'Your passcode is required in order to register for an account.',
}

export const SignInStrings = {
  PasscodeRequired: 'Your passcode is required in order to sign in to your account.',
  IncorrectMfa: 'Incorrect two-factor authentication code. Please try again.',
  SignInCanceledMissingMfa: 'Your sign in request has been canceled.',
}

export const ProtocolUpgradeStrings = {
  SuccessAccount:
    "Your encryption version has been successfully upgraded. You may be asked to enter your credentials again on other devices you're signed into.",
  SuccessPasscodeOnly: 'Your encryption version has been successfully upgraded.',
  Fail: 'Unable to upgrade encryption version. Please try again.',
  UpgradingPasscode: 'Upgrading local encryption...',
}

export const ChallengeModalTitle = {
  Generic: 'Authentication Required',
  Migration: 'Storage Update',
}

export const SessionStrings = {
  EnterEmailAndPassword: 'Please enter your account email and password.',
  RecoverSession(email?: string): string {
    return email
      ? `Your credentials are needed for ${email} to refresh your session with the server.`
      : 'Your credentials are needed to refresh your session with the server.'
  },
  SessionRestored: 'Your session has been successfully restored.',
  EnterMfa: 'Please enter your two-factor authentication code.',
  InputU2FDevice: 'Please authenticate with your hardware security key.',
  MfaInputPlaceholder: 'Two-factor authentication code',
  EmailInputPlaceholder: 'Email',
  PasswordInputPlaceholder: 'Password',
  KeychainRecoveryErrorTitle: 'Invalid Credentials',
  KeychainRecoveryError:
    'The email or password you entered is incorrect.\n\nPlease note that this sign-in request is made against the default server. If you are using a custom server, you must uninstall the app then reinstall, and sign back into your account.',
  RevokeTitle: 'Revoke this session?',
  RevokeConfirmButton: 'Revoke',
  RevokeCancelButton: 'Cancel',
  RevokeText:
    'The associated app will be signed out and all data removed ' +
    'from the device when it is next launched. You can sign back in on that ' +
    'device at any time.',
  CurrentSessionRevoked: 'Your session has been revoked and all local data has been removed ' + 'from this device.',
}

export const ChallengeStrings = {
  UnlockApplication: 'Authentication is required to unlock the application',
  NoteAccess: 'Authentication is required to view this note',
  FileAccess: 'Authentication is required to access this file',
  ImportFile: 'Authentication is required to import a backup file',
  AddPasscode: 'Authentication is required to add a passcode',
  RemovePasscode: 'Authentication is required to remove your passcode',
  ChangePasscode: 'Authentication is required to change your passcode',
  ChangeAutolockInterval: 'Authentication is required to change autolock timer duration',
  RevokeSession: 'Authentication is required to revoke a session',
  EnterAccountPassword: 'Enter your account password',
  EnterLocalPasscode: 'Enter your application passcode',
  EnterPasscodeForMigration:
    'Your application passcode is required to perform an upgrade of your local data storage structure.',
  EnterPasscodeForRootResave: 'Enter your application passcode to continue',
  EnterCredentialsForProtocolUpgrade: 'Enter your credentials to perform encryption upgrade',
  EnterCredentialsForDecryptedBackupDownload: 'Enter your credentials to download a decrypted backup',
  AccountPasswordPlaceholder: 'Account Password',
  LocalPasscodePlaceholder: 'Application Passcode',
  DecryptEncryptedFile: 'Enter the account password associated with the import file',
  ExportBackup: 'Authentication is required to export a backup',
  DisableBiometrics: 'Authentication is required to disable biometrics',
  UnprotectNote: 'Authentication is required to unprotect a note',
  UnprotectFile: 'Authentication is required to unprotect a file',
  SearchProtectedNotesText: 'Authentication is required to search protected contents',
  SelectProtectedNote: 'Authentication is required to select a protected note',
  DisableMfa: 'Authentication is required to disable two-factor authentication',
  DeleteAccount: 'Authentication is required to delete your account',
  ListedAuthorization: 'Authentication is required to approve this note for Listed',
  UnlockVault: (vaultName: string) => `Unlock ${vaultName}`,
  DeleteVault: (vaultName: string) => `Delete ${vaultName}`,
  EnterVaultPassword: 'Enter the password for this vault',
}

export const ErrorAlertStrings = {
  MissingSessionTitle: 'Missing Session',
  MissingSessionBody:
    'We were unable to load your server session. This represents an inconsistency with your application state. Please take an opportunity to backup your data, then sign out and sign back in to resolve this issue.',

  StorageDecryptErrorTitle: 'Storage Error',
  StorageDecryptErrorBody:
    "We were unable to decrypt your local storage. Please restart the app and try again. If you're unable to resolve this issue, and you have an account, you may try uninstalling the app then reinstalling, then signing back into your account. Otherwise, please contact help@standardnotes.com for support.",
}

export const KeychainRecoveryStrings = {
  Title: 'Restore Keychain',
  Text: (email: string) =>
    `We've detected that your keychain has been wiped. This can happen when restoring your device from a backup. Please enter your account password for "${email}" to restore your account keys.`,
}
