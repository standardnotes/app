/** @generic */
export const STRING_SESSION_EXPIRED            = "Your session has expired. New changes will not be pulled in. Please sign out and sign back in to refresh your session.";
export const STRING_DEFAULT_FILE_ERROR         = "Please use FileSafe or the Bold Editor to attach images and files. Learn more at standardnotes.org/filesafe.";
export const STRING_GENERIC_SYNC_ERROR         = "There was an error syncing. Please try again. If all else fails, try signing out and signing back in.";
export function StringSyncException(data) {
  return `There was an error while trying to save your items. Please contact support and share this message: ${data}.`;
}

/** @footer */
export const STRING_NEW_UPDATE_READY           = "A new update is ready to install. Please use the top-level 'Updates' menu to manage installation.";

/** @tags */
export const STRING_DELETE_TAG                 = "Are you sure you want to delete this tag? Note: deleting a tag will not delete its notes.";

/** @editor */
export const STRING_DELETED_NOTE               = "The note you are attempting to edit has been deleted, and is awaiting sync. Changes you make will be disregarded.";
export const STRING_INVALID_NOTE               = "The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.";
export const STRING_ELLIPSES                   = "...";
export const STRING_GENERIC_SAVE_ERROR         = "There was an error saving your note. Please try again.";
export const STRING_DELETE_PLACEHOLDER_ATTEMPT = "This note is a placeholder and cannot be deleted. To remove from your list, simply navigate to a different note.";
export const STRING_DELETE_LOCKED_ATTEMPT      = "This note is locked. If you'd like to delete it, unlock it, and try again.";
export function StringDeleteNote({title, permanently}) {
  return permanently
    ? `Are you sure you want to permanently delete ${title}?`
    : `Are you sure you want to move ${title} to the trash?`;
}
export function StringEmptyTrash({count}) {
  return `Are you sure you want to permanently delete ${count} note(s)?`;
}

/** @account */
export const STRING_ACCOUNT_MENU_UNCHECK_MERGE        = "Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?";
export const STRING_SIGN_OUT_CONFIRMATION             = "Are you sure you want to end your session? This will delete all local items and extensions.";
export const STRING_ERROR_DECRYPTING_IMPORT           = "There was an error decrypting your items. Make sure the password you entered is correct and try again.";
export const STRING_E2E_ENABLED                       = "End-to-end encryption is enabled. Your data is encrypted on your device first, then synced to your private cloud.";
export const STRING_LOCAL_ENC_ENABLED                 = "Encryption is enabled. Your data is encrypted using your passcode before it is saved to your device storage.";
export const STRING_ENC_NOT_ENABLED                   = "Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.";
export const STRING_IMPORT_SUCCESS                    = "Your data has been successfully imported.";
export const STRING_REMOVE_PASSCODE_CONFIRMATION      = "Are you sure you want to remove your local passcode?";
export const STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM  = " This will remove encryption from your local data.";
export const STRING_NON_MATCHING_PASSCODES            = "The two passcodes you entered do not match. Please try again.";
export const STRING_NON_MATCHING_PASSWORDS            = "The two passwords you entered do not match. Please try again.";
export const STRING_GENERATING_LOGIN_KEYS             = "Generating Login Keys...";
export const STRING_GENERATING_REGISTER_KEYS          = "Generating Account Keys...";
export const STRING_INVALID_IMPORT_FILE               = "Unable to open file. Ensure it is a proper JSON file and try again.";
export function StringImportError({errorCount}) {
  return `Import complete. ${errorCount} items were not imported because there was an error decrypting them. Make sure the password is correct and try again.`;
}

/** @password_change */
export const STRING_FAILED_PASSWORD_CHANGE = "There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.";
