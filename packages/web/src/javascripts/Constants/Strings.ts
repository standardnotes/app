import { escapeHtmlString, Platform, SNApplication } from '@standardnotes/snjs'
import { getPlatform, isDesktopApplication } from '../Utils'
import { c, msgid } from 'ttag'

/** @generic */
export const STRING_DEFAULT_FILE_ERROR = () =>
  c('Error')
    .t`Please use FileSafe or the Bold Editor to attach images and files. Learn more at standardnotes.com/filesafe.`
export const STRING_GENERIC_SYNC_ERROR = () =>
  c('B1.Account.Session.Error')
    .t`There was an error syncing. Please try again. If all else fails, try signing out and signing back in.`
export function StringSyncException(data: unknown) {
  return `There was an error while trying to save your items. Please contact support and share this message: ${JSON.stringify(
    data,
  )}.`
}

/** @footer */
export const STRING_NEW_UPDATE_READY =
  "A new update is ready to install. Please use the top-level 'Updates' menu to manage installation."

/** @tags */
export const STRING_DELETE_TAG =
  'Are you sure you want to delete this tag? Deleting a tag will not delete its subtags or its notes.'

export const STRING_MISSING_SYSTEM_TAG = 'We are missing a System Tag.'

/** @editor */
export const STRING_GENERIC_SAVE_ERROR = 'There was an error saving your note. Please try again.'
export const STRING_DELETE_PLACEHOLDER_ATTEMPT =
  'This note is a placeholder and cannot be deleted. To remove from your list, simply navigate to a different note.'
export const STRING_ARCHIVE_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to archive it, enable editing, and try again."
export const STRING_UNARCHIVE_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to unarchive it, enable editing, and try again."
export const STRING_DELETE_LOCKED_ATTEMPT =
  "This note had editing disabled. If you'd like to delete it, enable editing, and try again."
export const STRING_EDIT_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to edit its options, enable editing, and try again."
export const STRING_RESTORE_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to restore it to a previous revision, enable editing and try again."
export function StringDeleteNote(title: string, permanently: boolean) {
  const escapedTitle = escapeHtmlString(title)
  return permanently
    ? `Are you sure you want to permanently delete ${escapedTitle}?`
    : `Are you sure you want to move ${escapedTitle} to the trash?`
}
export function StringEmptyTrash(count: number) {
  return c('Confirmation').ngettext(
    msgid`Are you sure you want to permanently delete ${count} note?`,
    `Are you sure you want to permanently delete ${count} notes?`,
    count,
  )
}

/** @account */
export const STRING_SIGN_OUT_CONFIRMATION = () =>
  c('B1.Account.Session.Info')
    .t`This action will remove this workspace and its related data from this device. Your synced data will not be affected.`
export const STRING_E2E_ENABLED = () =>
  c('B1.Account.ImportExport.Info')
    .t`End-to-end encryption is enabled. Your data is encrypted on your device first, then synced to your private cloud.`
export const STRING_LOCAL_ENC_ENABLED = () =>
  c('B1.Account.ImportExport.Info')
    .t`Encryption is enabled. Your data is encrypted using your passcode before it is saved to your device storage.`
export const STRING_ENC_NOT_ENABLED = () =>
  c('B1.Account.ImportExport.Info')
    .t`Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.`
export const STRING_IMPORT_SUCCESS = () =>
  c('B1.Account.ImportExport.Info').t`Your data has been successfully imported.`
export const STRING_REMOVE_PASSCODE_CONFIRMATION = 'Are you sure you want to remove your application passcode?'
export const STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM = ' This will remove encryption from your local data.'
export const STRING_NON_MATCHING_PASSCODES = 'The two passcodes you entered do not match. Please try again.'
export const STRING_NON_MATCHING_PASSWORDS = () =>
  c('B1.Account.SignIn.Error').t`The two passwords you entered do not match. Please try again.`
export const STRING_INVALID_IMPORT_FILE = () =>
  c('B1.Account.ImportExport.Error').t`Unable to open file. Ensure it is a proper JSON file and try again.`
export const STRING_IMPORTING_ZIP_FILE = () =>
  c('B1.Account.ImportExport.Error')
    .t`The file you selected is not a valid backup file. Please extract the contents of the zip file, then upload the contained .txt file.`
export function StringImportError(errorCount: number) {
  return c('B1.Account.ImportExport.Info').ngettext(
    msgid`Import complete. ${errorCount} item was not imported because there was an error decrypting it. Make sure the password is correct and try again.`,
    `Import complete. ${errorCount} items were not imported because there was an error decrypting them. Make sure the password is correct and try again.`,
    errorCount,
  )
}
export const STRING_UNSUPPORTED_BACKUP_FILE_VERSION = () =>
  c('B1.Account.ImportExport.Error')
    .t`This backup file was created using an unsupported version of the application and cannot be imported here. Please update your application and try again.`

/** @password_change */
export const STRING_CONFIRM_APP_QUIT_DURING_UPGRADE = () =>
  c('B1.Account.Password.Info')
    .t`The encryption upgrade is in progress. You may lose data if you quit the app. Are you sure you want to quit?`

export const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE =
  'A passcode change is in progress. You may lose data if you quit the app. ' + 'Are you sure you want to quit?'

export const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL =
  'A passcode removal is in progress. You may lose data if you quit the app. ' + 'Are you sure you want to quit?'

export const STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE = () => c('B1.Account.Password.Title').t`Encryption upgrade available`
export const STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT = () =>
  c('B1.Account.Password.Info')
    .t`Encryption version 004 is available. This version strengthens the encryption algorithms your account and local storage use. To learn more about this upgrade, visit our <a href="https://standardnotes.com/help/security" target="_blank">Security Upgrade page.</a>`
export const STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON = () => c('B1.Account.Password.Action').t`Upgrade`

export const STRING_REMOVE_OFFLINE_KEY_CONFIRMATION = 'This will delete the previously saved offline key.'

export const STRING_DELETE_ACCOUNT_CONFIRMATION = () =>
  c('B1.Account.Session.Info')
    .t`Are you sure you want to permanently delete your account? You will be asked to confirm your account password in the next step. If you have an active paid subscription, cancel the subscription first. Otherwise, if you'd like to keep the subscription, you can re-register with the same email after deletion, and your subscription will be linked back up with your account.`

export const STRING_FAILED_TO_UPDATE_USER_SETTING = () =>
  c('B1.Account.Session.Error').t`There was an error while trying to update your settings. Please try again.`

export const Strings = {
  protectingNoteWithoutProtectionSources:
    'Access to this note will not be restricted until you set up a passcode or account.',
  trashItemsTitle: 'Move to Trash',
  deleteItemsPermanentlyTitle: 'Delete Permanently',
  trashNotesText: 'Are you sure you want to move these notes to the trash?',
  trashFilesText: 'Are you sure you want to move these files to the trash?',
  enterPasscode: 'Please enter a passcode.',
  deleteMultipleFiles: 'Are you sure you want to permanently delete these files?',
}

export const StringUtils = {
  keyStorageInfo(application: SNApplication): string | null {
    if (!isDesktopApplication()) {
      return null
    }
    if (!application.hasAccount()) {
      return null
    }
    const platform = getPlatform(application.device)
    const keychainName =
      platform === Platform.WindowsDesktop
        ? 'credential manager'
        : platform === Platform.MacDesktop
        ? 'keychain'
        : 'password manager'
    return `Your keys are currently stored in your operating system's ${keychainName}. Adding a passcode prevents even your operating system from reading them.`
  },
  deleteNotes(permanently: boolean, notesCount = 1, title?: string): string {
    if (notesCount === 1) {
      const escapedTitle = escapeHtmlString(title || '')
      return permanently
        ? `Are you sure you want to permanently delete ${escapedTitle}?`
        : `Are you sure you want to move ${escapedTitle} to the trash?`
    } else {
      return permanently
        ? 'Are you sure you want to permanently delete these notes?'
        : 'Are you sure you want to move these notes to the trash?'
    }
  },
  deleteFile(title: string): string {
    const escapedTitle = escapeHtmlString(title)
    return `Are you sure you want to permanently delete ${escapedTitle}?`
  },
  archiveLockedNotesAttempt(archive: boolean, notesCount = 1): string {
    const archiveString = archive ? 'archive' : 'unarchive'
    return notesCount === 1
      ? `This note has editing disabled. If you'd like to ${archiveString} it, enable editing, and try again.`
      : `One or more of these notes have editing disabled. If you'd like to ${archiveString} them, make sure editing is enabled on all of them, and try again.`
  },
  deleteLockedNotesAttempt(notesCount = 1): string {
    return notesCount === 1
      ? "This note has editing disabled. If you'd like to delete it, enable editing, and try again."
      : "One or more of these notes have editing disabled. If you'd like to delete them, make sure editing is enabled on all of them, and try again."
  },
  deleteTag(title: string): string {
    const escapedTitle = escapeHtmlString(title)
    return `Delete tag "${escapedTitle}"?`
  },
  cannotUploadFile(name: string): string {
    const escapedName = escapeHtmlString(name)
    return `Cannot upload file "${escapedName}"`
  },
}
