import { ApplicationStage } from './../Application/ApplicationStage'
export enum ApplicationEvent {
  SignedIn = 'signed-in',
  SignedOut = 'signed-out',

  /** When a full, potentially multi-page sync completes */
  CompletedFullSync = 'completed-full-sync',

  FailedSync = 'failed-sync',
  HighLatencySync = 'high-latency-sync',
  EnteredOutOfSync = 'entered-out-of-sync',
  ExitedOutOfSync = 'exited-out-of-sync',

  ApplicationStageChanged = 'application-stage-changed',

  /**
   * The application has finished its prepareForLaunch state and is now ready for unlock
   * Called when the application has initialized and is ready for launch, but before
   * the application has been unlocked, if applicable. Use this to do pre-launch
   * configuration, but do not attempt to access user data like notes or tags.
   */
  Started = 'started',

  /**
   * The applicaiton is fully unlocked and ready for i/o
   * Called when the application has been fully decrypted and unlocked. Use this to
   * to begin streaming data like notes and tags.
   */
  Launched = 'launched',

  LocalDataLoaded = 'local-data-loaded',

  /**
   * When the root key or root key wrapper changes. Includes events like account state
   * changes (registering, signing in, changing pw, logging out) and passcode state
   * changes (adding, removing, changing).
   */
  KeyStatusChanged = 'key-status-changed',

  MajorDataChange = 'major-data-change',
  CompletedRestart = 'completed-restart',
  LocalDataIncrementalLoad = 'local-data-incremental-load',
  SyncStatusChanged = 'sync-status-changed',
  WillSync = 'will-sync',
  InvalidSyncSession = 'invalid-sync-session',
  LocalDatabaseReadError = 'local-database-read-error',
  LocalDatabaseWriteError = 'local-database-write-error',

  /**
   * When a single roundtrip completes with sync, in a potentially multi-page sync request.
   * If just a single roundtrip, this event will be triggered, along with CompletedFullSync
   */
  CompletedIncrementalSync = 'completed-incremental-sync',

  /**
   * The application has loaded all pending migrations (but not run any, except for the base one),
   * and consumers may now call hasPendingMigrations
   */
  MigrationsLoaded = 'migrations-loaded',

  /** When StorageService is ready (but NOT yet decrypted) to start servicing read/write requests */
  StorageReady = 'storage-ready',

  PreferencesChanged = 'preferences-changed',
  UnprotectedSessionBegan = 'unprotected-session-began',
  UserRolesChanged = 'user-roles-changed',
  FeaturesUpdated = 'features-updated',
  UnprotectedSessionExpired = 'unprotected-session-expired',

  /** Called when the app first launches and after first sync request made after sign in */
  CompletedInitialSync = 'completed-initial-sync',
  BiometricsSoftLockEngaged = 'biometrics-soft-lock-engaged',
  BiometricsSoftLockDisengaged = 'biometrics-soft-lock-disengaged',
  DidPurchaseSubscription = 'did-purchase-subscription',
}

export type ApplicationStageChangedEventPayload = {
  stage: ApplicationStage
}
