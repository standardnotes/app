import { Platform, SNApplication } from '@standardnotes/snjs';
import { getPlatform, isDesktopApplication } from './utils';

/** @generic */
export const STRING_SESSION_EXPIRED =
  'Your session has expired. New changes will not be pulled in. Please sign in to refresh your session.';
export const STRING_DEFAULT_FILE_ERROR =
  'Please use FileSafe or the Bold Editor to attach images and files. Learn more at standardnotes.org/filesafe.';
export const STRING_GENERIC_SYNC_ERROR =
  'There was an error syncing. Please try again. If all else fails, try signing out and signing back in.';
export function StringSyncException(data: any) {
  return `There was an error while trying to save your items. Please contact support and share this message: ${JSON.stringify(
    data
  )}.`;
}

/** @footer */
export const STRING_NEW_UPDATE_READY =
  "A new update is ready to install. Please use the top-level 'Updates' menu to manage installation.";

/** @tags */
export const STRING_DELETE_TAG =
  'Are you sure you want to delete this tag? Note: deleting a tag will not delete its notes.';

/** @editor */
export const STRING_SAVING_WHILE_DOCUMENT_HIDDEN =
  'Attempting to save an item while the application is hidden. To protect data integrity, please refresh the application window and try again.';
export const STRING_DELETED_NOTE =
  'The note you are attempting to edit has been deleted, and is awaiting sync. Changes you make will be disregarded.';
export const STRING_INVALID_NOTE =
  "The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.";
export const STRING_ELLIPSES = '...';
export const STRING_GENERIC_SAVE_ERROR =
  'There was an error saving your note. Please try again.';
export const STRING_DELETE_PLACEHOLDER_ATTEMPT =
  'This note is a placeholder and cannot be deleted. To remove from your list, simply navigate to a different note.';
export const STRING_ARCHIVE_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to archive it, enable editing, and try again.";
export const STRING_UNARCHIVE_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to unarchive it, enable editing, and try again.";
export const STRING_DELETE_LOCKED_ATTEMPT =
  "This note had editing disabled. If you'd like to delete it, enable editing, and try again.";
export const STRING_EDIT_LOCKED_ATTEMPT =
  "This note has editing disabled. If you'd like to edit its options, enable editing, and try again.";
export function StringDeleteNote(title: string, permanently: boolean) {
  return permanently
    ? `Are you sure you want to permanently delete ${title}?`
    : `Are you sure you want to move ${title} to the trash?`;
}
export function StringEmptyTrash(count: number) {
  return `Are you sure you want to permanently delete ${count} note(s)?`;
}

/** @account */
export const STRING_ACCOUNT_MENU_UNCHECK_MERGE =
  'Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?';
export const STRING_SIGN_OUT_CONFIRMATION = 'This will delete all local items and extensions.';
export const STRING_ERROR_DECRYPTING_IMPORT =
  'There was an error decrypting your items. Make sure the password you entered is correct and try again.';
export const STRING_E2E_ENABLED =
  'End-to-end encryption is enabled. Your data is encrypted on your device first, then synced to your private cloud.';
export const STRING_LOCAL_ENC_ENABLED =
  'Encryption is enabled. Your data is encrypted using your passcode before it is saved to your device storage.';
export const STRING_ENC_NOT_ENABLED =
  'Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.';
export const STRING_IMPORT_SUCCESS =
  'Your data has been successfully imported.';
export const STRING_REMOVE_PASSCODE_CONFIRMATION =
  'Are you sure you want to remove your application passcode?';
export const STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM =
  ' This will remove encryption from your local data.';
export const STRING_NON_MATCHING_PASSCODES =
  'The two passcodes you entered do not match. Please try again.';
export const STRING_NON_MATCHING_PASSWORDS =
  'The two passwords you entered do not match. Please try again.';
export const STRING_GENERATING_LOGIN_KEYS = 'Generating Login Keys...';
export const STRING_GENERATING_REGISTER_KEYS = 'Generating Account Keys...';
export const STRING_INVALID_IMPORT_FILE =
  'Unable to open file. Ensure it is a proper JSON file and try again.';
export function StringImportError(errorCount: number) {
  return `Import complete. ${errorCount} items were not imported because there was an error decrypting them. Make sure the password is correct and try again.`;
}
export const STRING_UNSUPPORTED_BACKUP_FILE_VERSION =
  'This backup file was created using an unsupported version of the application and cannot be imported here. Please update your application and try again.';

/** @password_change */
export const STRING_FAILED_PASSWORD_CHANGE =
  'There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.';

export const STRING_CONFIRM_APP_QUIT_DURING_UPGRADE =
  'The encryption upgrade is in progress. You may lose data if you quit the app. ' +
  'Are you sure you want to quit?';

export const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE =
  'A passcode change is in progress. You may lose data if you quit the app. ' +
  'Are you sure you want to quit?';

export const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL =
  'A passcode removal is in progress. You may lose data if you quit the app. ' +
  'Are you sure you want to quit?';

export const STRING_UPGRADE_ACCOUNT_CONFIRM_TITLE =
  'Encryption upgrade available';
export const STRING_UPGRADE_ACCOUNT_CONFIRM_TEXT =
  'Encryption version 004 is available. ' +
  'This version strengthens the encryption algorithms your account and ' +
  'local storage use. To learn more about this upgrade, visit our ' +
  '<a href="https://standardnotes.org/help/security" target="_blank">Security Upgrade page.</a>';
export const STRING_UPGRADE_ACCOUNT_CONFIRM_BUTTON = 'Upgrade';

export const Strings = {
  protectingNoteWithoutProtectionSources: 'Access to this note will not be restricted until you set up a passcode or account.',
  openAccountMenu: 'Open Account Menu',
  trashNotesTitle: 'Move to Trash',
  trashNotesText: 'Are you sure you want to move these notes to the trash?',
  enterPasscode: 'Please enter a passcode.',
};

export const StringUtils = {
  keyStorageInfo(application: SNApplication): string | null {
    if (!isDesktopApplication()) {
      return null;
    }
    if (!application.hasAccount()) {
      return null;
    }
    const platform = getPlatform();
    const keychainName =
      platform === Platform.WindowsDesktop
        ? 'credential manager'
        : platform === Platform.MacDesktop
        ? 'keychain'
        : 'password manager';
    return `Your keys are currently stored in your operating system's ${keychainName}. Adding a passcode prevents even your operating system from reading them.`;
  },
  deleteNotes(permanently: boolean, notesCount = 1, title?: string): string {
    if (notesCount === 1) {
      return permanently
        ? `Are you sure you want to permanently delete ${title}?`
        : `Are you sure you want to move ${title} to the trash?`;
    } else {
      return permanently
        ? `Are you sure you want to permanently delete these notes?`
        : `Are you sure you want to move these notes to the trash?`;
    }
  },
  archiveLockedNotesAttempt(archive: boolean, notesCount = 1): string {
    const archiveString = archive ? 'archive' : 'unarchive';
    return notesCount === 1
      ? `This note has editing disabled. If you'd like to ${archiveString} it, enable editing, and try again.`
      : `One or more of these notes have editing disabled. If you'd like to ${archiveString} them, make sure editing is enabled on all of them, and try again.`;
  },
  deleteLockedNotesAttempt(notesCount = 1): string {
    return notesCount === 1
      ? "This note has editing disabled. If you'd like to delete it, enable editing, and try again."
      : "One or more of these notes have editing disabled. If you'd like to delete them, make sure editing is enabled on all of them, and try again.";
  },
};