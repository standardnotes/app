/**
 * Unmanaged keys stored in root storage.
 * Raw storage keys exist outside of StorageManager domain
 */
export enum RawStorageKey {
  StorageObject = 'storage',
  DescriptorRecord = 'descriptors',
  SnjsVersion = 'snjs_version',
  HomeServerEnabled = 'home_server_enabled',
  HomeServerDataLocation = 'home_serve_data_location',
}

/**
 * Keys used for retrieving and saving simple key/value pairs.
 * These keys are managed and are embedded inside RawStorageKey.StorageObject
 */
export enum StorageKey {
  RootKeyParams = 'ROOT_KEY_PARAMS',
  WrappedRootKey = 'WRAPPED_ROOT_KEY',
  RootKeyWrapperKeyParams = 'ROOT_KEY_WRAPPER_KEY_PARAMS',
  Session = 'session',
  User = 'user',
  ServerHost = 'server',
  LegacyUuid = 'uuid',
  LastSyncToken = 'syncToken',
  PaginationToken = 'cursorToken',
  BiometricsState = 'biometrics_state',
  MobilePasscodeTiming = 'passcode_timing',
  MobileBiometricsTiming = 'biometrics_timing',
  MobilePasscodeKeyboardType = 'passcodeKeyboardType',
  MobilePreferences = 'preferences',
  MobileScreenshotPrivacyEnabled = 'screenshotPrivacy_enabled',
  ProtectionExpirey = 'SessionExpiresAtKey',
  ProtectionSessionLength = 'SessionLengthKey',
  KeyRecoveryUndecryptableItems = 'key_recovery_undecryptable',
  WebSocketUrl = 'webSocket_url',
  UserRoles = 'user_roles',
  OfflineUserRoles = 'offline_user_roles',
  ExperimentalFeatures = 'experimental_features',
  DeinitMode = 'deinit_mode',
  CodeVerifier = 'code_verifier',
  LaunchPriorityUuids = 'launch_priority_uuids',
  LastReadChangelogVersion = 'last_read_changelog_version',
  MomentsEnabled = 'moments_enabled',
  TextBackupsEnabled = 'text_backups_enabled',
  TextBackupsLocation = 'text_backups_location',
  PlaintextBackupsEnabled = 'plaintext_backups_enabled',
  PlaintextBackupsLocation = 'plaintext_backups_location',
  FileBackupsEnabled = 'file_backups_enabled',
  FileBackupsLocation = 'file_backups_location',
  VaultSelectionOptions = 'vault_selection_options',
  Subscription = 'subscription',
  LocalPreferences = 'local_preferences',
}

export enum NonwrappedStorageKey {
  MobileFirstRun = 'first_run',
}

export function namespacedKey(namespace: string, key: string) {
  return `${namespace}-${key}`
}

export const LegacyKeys1_0_0 = {
  WebPasscodeParamsKey: 'offlineParams',
  MobilePasscodeParamsKey: 'pc_params',
  AllAccountKeyParamsKey: 'auth_params',
  WebEncryptedStorageKey: 'encryptedStorage',
  MobileWrappedRootKeyKey: 'encrypted_account_keys',
  MobileBiometricsPrefs: 'biometrics_prefs',
  AllMigrations: 'migrations',
  MobileThemesCache: 'ThemePreferencesKey',
  MobileLightTheme: 'lightTheme',
  MobileDarkTheme: 'darkTheme',
  MobileLastExportDate: 'LastExportDateKey',
  MobileDoNotWarnUnsupportedEditors: 'DoNotShowAgainUnsupportedEditorsKey',
  MobileOptionsState: 'options',
  MobilePasscodeKeyboardType: 'passcodeKeyboardType',
}
