import { ProtocolVersion } from '@standardnotes/models'
import { c } from 'ttag'

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

export const API_MESSAGE_RATE_LIMITED = c('B2.SharedUI.Error')
  .t`Too many successive server requests. Please wait a few minutes and try again.`

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

export const SETTING_PASSCODE = () => c('B4.Security.Passcode.Status').t`Setting passcode…`
export const CHANGING_PASSCODE = () => c('B4.Security.Passcode.Status').t`Changing passcode…`
export const REMOVING_PASSCODE = () => c('B4.Security.Passcode.Status').t`Removing passcode…`

export const DO_NOT_CLOSE_APPLICATION = () =>
  c('B4.Security.Passcode.Warning').t`Do not close the application until this process completes.`

export const UNKNOWN_ERROR = c('B2.SharedUI.Error').t`Unknown error.`

export function InsufficientPasswordMessage(minimum: number): string {
  return `Your password must be at least ${minimum} characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.`
}

export function StrictSignInFailed(current: ProtocolVersion, latest: ProtocolVersion): string {
  return `Strict Sign In has refused the server's sign-in parameters. The latest account version is ${latest}, but the server is reporting a version of ${current} for your account. If you'd like to proceed with sign in anyway, please disable Strict Sign In and try again.`
}

export const CredentialsChangeStrings = {
  get PasscodeRequired() {
    return c('B4.Security.Challenge.Info').t`Your passcode is required to process your credentials change.`
  },
  Failed: 'Unable to change your credentials due to a sync error. Please try again.',
}

export const RegisterStrings = {
  get PasscodeRequired() {
    return c('B4.Security.Challenge.Info').t`Your passcode is required in order to register for an account.`
  },
}

export const SignInStrings = {
  get PasscodeRequired() {
    return c('B4.Security.Challenge.Info').t`Your passcode is required in order to sign in to your account.`
  },
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
  get Generic() {
    return c('B4.Security.Challenge.Title').t`Authentication Required`
  },
  get Migration() {
    return c('B4.Security.Challenge.Title').t`Storage Update`
  },
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
  get KeychainRecoveryErrorTitle() {
    return c('B4.Security.KeyStorage.Error').t`Invalid Credentials`
  },
  get KeychainRecoveryError() {
    return c('B4.Security.KeyStorage.Info')
      .t`The email or password you entered is incorrect.\n\nPlease note that this sign-in request is made against the default server. If you are using a custom server, you must uninstall the app then reinstall, and sign back into your account.`
  },
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
  get UnlockApplication() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to unlock the application`
  },
  get NoteAccess() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to view this note`
  },
  get FileAccess() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to access this file`
  },
  get ImportFile() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to import a backup file`
  },
  get AddPasscode() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to add a passcode`
  },
  get RemovePasscode() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to remove your passcode`
  },
  get ChangePasscode() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to change your passcode`
  },
  get ChangeAutolockInterval() {
    return c('B4.Security.Autolock.Info').t`Authentication is required to change autolock timer duration`
  },
  get RevokeSession() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to revoke a session`
  },
  get EnterAccountPassword() {
    return c('B4.Security.Challenge.Label').t`Enter your account password`
  },
  get EnterLocalPasscode() {
    return c('B4.Security.Challenge.Label').t`Enter your application passcode`
  },
  get EnterPasscodeForMigration() {
    return c('B4.Security.Challenge.Info')
      .t`Your application passcode is required to perform an upgrade of your local data storage structure.`
  },
  get EnterPasscodeForRootResave() {
    return c('B4.Security.Challenge.Label').t`Enter your application passcode to continue`
  },
  get EnterCredentialsForProtocolUpgrade() {
    return c('B4.Security.Challenge.Label').t`Enter your credentials to perform encryption upgrade`
  },
  get EnterCredentialsForDecryptedBackupDownload() {
    return c('B4.Security.Challenge.Label').t`Enter your credentials to download a decrypted backup`
  },
  get AccountPasswordPlaceholder() {
    return c('B4.Security.Challenge.Placeholder').t`Account Password`
  },
  get LocalPasscodePlaceholder() {
    return c('B4.Security.Challenge.Placeholder').t`Application Passcode`
  },
  get DecryptEncryptedFile() {
    return c('B4.Security.Challenge.Label').t`Enter the account password associated with the import file`
  },
  get ExportBackup() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to export a backup`
  },
  get DisableBiometrics() {
    return c('B4.Security.Biometrics.Info').t`Authentication is required to disable biometrics`
  },
  get UnprotectNote() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to unprotect a note`
  },
  get UnprotectFile() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to unprotect a file`
  },
  get SearchProtectedNotesText() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to search protected contents`
  },
  get SelectProtectedNote() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to select a protected note`
  },
  get DisableMfa() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to disable two-factor authentication`
  },
  get DeleteAccount() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to delete your account`
  },
  get ListedAuthorization() {
    return c('B4.Security.Challenge.Info').t`Authentication is required to approve this note for Listed`
  },
  UnlockVault(vaultName: string): string {
    return c('B4.Security.Challenge.Info').jt`Unlock ${vaultName}` as unknown as string
  },
  DeleteVault(vaultName: string): string {
    return c('B4.Security.Challenge.Info').jt`Delete ${vaultName}` as unknown as string
  },
  get EnterVaultPassword() {
    return c('B4.Security.Challenge.Label').t`Enter the password for this vault`
  },
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
  get Title() {
    return c('B4.Security.KeyStorage.Title').t`Restore Keychain`
  },
  Text(email: string): string {
    return c('B4.Security.KeyStorage.Info')
      .jt`We've detected that your keychain has been wiped. This can happen when restoring your device from a backup. Please enter your account password for "${email}" to restore your account keys.` as unknown as string
  },
}
