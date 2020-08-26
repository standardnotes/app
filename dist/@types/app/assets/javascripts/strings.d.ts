/** @generic */
export declare const STRING_SESSION_EXPIRED = "Your session has expired. New changes will not be pulled in. Please sign out and sign back in to refresh your session.";
export declare const STRING_DEFAULT_FILE_ERROR = "Please use FileSafe or the Bold Editor to attach images and files. Learn more at standardnotes.org/filesafe.";
export declare const STRING_GENERIC_SYNC_ERROR = "There was an error syncing. Please try again. If all else fails, try signing out and signing back in.";
export declare function StringSyncException(data: any): string;
/** @footer */
export declare const STRING_NEW_UPDATE_READY = "A new update is ready to install. Please use the top-level 'Updates' menu to manage installation.";
/** @tags */
export declare const STRING_DELETE_TAG = "Are you sure you want to delete this tag? Note: deleting a tag will not delete its notes.";
/** @editor */
export declare const STRING_DELETED_NOTE = "The note you are attempting to edit has been deleted, and is awaiting sync. Changes you make will be disregarded.";
export declare const STRING_INVALID_NOTE = "The note you are attempting to save can not be found or has been deleted. Changes you make will not be synced. Please copy this note's text and start a new note.";
export declare const STRING_ELLIPSES = "...";
export declare const STRING_GENERIC_SAVE_ERROR = "There was an error saving your note. Please try again.";
export declare const STRING_DELETE_PLACEHOLDER_ATTEMPT = "This note is a placeholder and cannot be deleted. To remove from your list, simply navigate to a different note.";
export declare const STRING_DELETE_LOCKED_ATTEMPT = "This note is locked. If you'd like to delete it, unlock it, and try again.";
export declare function StringDeleteNote(title: string, permanently: boolean): string;
export declare function StringEmptyTrash(count: number): string;
/** @account */
export declare const STRING_ACCOUNT_MENU_UNCHECK_MERGE = "Unchecking this option means any of the notes you have written while you were signed out will be deleted. Are you sure you want to discard these notes?";
export declare const STRING_SIGN_OUT_CONFIRMATION = "Are you sure you want to end your session? This will delete all local items and extensions.";
export declare const STRING_ERROR_DECRYPTING_IMPORT = "There was an error decrypting your items. Make sure the password you entered is correct and try again.";
export declare const STRING_E2E_ENABLED = "End-to-end encryption is enabled. Your data is encrypted on your device first, then synced to your private cloud.";
export declare const STRING_LOCAL_ENC_ENABLED = "Encryption is enabled. Your data is encrypted using your passcode before it is saved to your device storage.";
export declare const STRING_ENC_NOT_ENABLED = "Encryption is not enabled. Sign in, register, or add a passcode lock to enable encryption.";
export declare const STRING_IMPORT_SUCCESS = "Your data has been successfully imported.";
export declare const STRING_REMOVE_PASSCODE_CONFIRMATION = "Are you sure you want to remove your application passcode?";
export declare const STRING_REMOVE_PASSCODE_OFFLINE_ADDENDUM = " This will remove encryption from your local data.";
export declare const STRING_NON_MATCHING_PASSCODES = "The two passcodes you entered do not match. Please try again.";
export declare const STRING_NON_MATCHING_PASSWORDS = "The two passwords you entered do not match. Please try again.";
export declare const STRING_GENERATING_LOGIN_KEYS = "Generating Login Keys...";
export declare const STRING_GENERATING_REGISTER_KEYS = "Generating Account Keys...";
export declare const STRING_INVALID_IMPORT_FILE = "Unable to open file. Ensure it is a proper JSON file and try again.";
export declare function StringImportError(errorCount: number): string;
export declare const STRING_ENTER_ACCOUNT_PASSCODE = "Enter your application passcode";
export declare const STRING_ENTER_ACCOUNT_PASSWORD = "Enter your account password";
export declare const STRING_ENTER_PASSCODE_FOR_MIGRATION = "Your application passcode is required to perform an upgrade of your local data storage structure.";
export declare const STRING_STORAGE_UPDATE = "Storage Update";
export declare const STRING_AUTHENTICATION_REQUIRED = "Authentication Required";
/** @password_change */
export declare const STRING_FAILED_PASSWORD_CHANGE = "There was an error re-encrypting your items. Your password was changed, but not all your items were properly re-encrypted and synced. You should try syncing again. If all else fails, you should restore your notes from backup.";
export declare const STRING_CONFIRM_APP_QUIT_DURING_UPGRADE: string;
export declare const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_CHANGE: string;
export declare const STRING_CONFIRM_APP_QUIT_DURING_PASSCODE_REMOVAL: string;
