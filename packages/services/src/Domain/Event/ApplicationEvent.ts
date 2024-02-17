export enum ApplicationEvent {
  SignedIn = 'Application:SignedIn',
  SignedOut = 'Application:SignedOut',
  /** When a full, potentially multi-page sync completes */
  CompletedFullSync = 'Application:CompletedFullSync',
  FailedSync = 'Application:FailedSync',
  HighLatencySync = 'Application:HighLatencySync',
  EnteredOutOfSync = 'Application:EnteredOutOfSync',
  ExitedOutOfSync = 'Application:ExitedOutOfSync',
  ApplicationStageChanged = 'Application:ApplicationStageChanged',
  /**
   * The application has finished its prepareForLaunch state and is now ready for unlock
   * Called when the application has initialized and is ready for launch, but before
   * the application has been unlocked, if applicable. Use this to do pre-launch
   * configuration, but do not attempt to access user data like notes or tags.
   */
  Started = 'Application:Started',
  /**
   * The applicaiton is fully unlocked and ready for i/o
   * Called when the application has been fully decrypted and unlocked. Use this to
   * to begin streaming data like notes and tags.
   */
  Launched = 'Application:Launched',
  LocalDataLoaded = 'Application:LocalDataLoaded',
  /**
   * When the root key or root key wrapper changes. Includes events like account state
   * changes (registering, signing in, changing pw, logging out) and passcode state
   * changes (adding, removing, changing).
   */
  KeyStatusChanged = 'Application:KeyStatusChanged',
  MajorDataChange = 'Application:MajorDataChange',
  CompletedRestart = 'Application:CompletedRestart',
  LocalDataIncrementalLoad = 'Application:LocalDataIncrementalLoad',
  SyncStatusChanged = 'Application:SyncStatusChanged',
  WillSync = 'Application:WillSync',
  InvalidSyncSession = 'Application:InvalidSyncSession',
  LocalDatabaseReadError = 'Application:LocalDatabaseReadError',
  LocalDatabaseWriteError = 'Application:LocalDatabaseWriteError',
  /**
   * When a single roundtrip completes with sync, in a potentially multi-page sync request.
   * If just a single roundtrip, this event will be triggered, along with CompletedFullSync
   */
  CompletedIncrementalSync = 'Application:CompletedIncrementalSync',
  /**
   * The application has loaded all pending migrations (but not run any, except for the base one),
   * and consumers may now call hasPendingMigrations
   */
  MigrationsLoaded = 'Application:MigrationsLoaded',
  /** When StorageService is ready (but NOT yet decrypted) to start servicing read/write requests */
  StorageReady = 'Application:StorageReady',
  PreferencesChanged = 'Application:PreferencesChanged',
  LocalPreferencesChanged = 'Application:LocalPreferencesChanged',
  UnprotectedSessionBegan = 'Application:UnprotectedSessionBegan',
  UserRolesChanged = 'Application:UserRolesChanged',
  FeaturesAvailabilityChanged = 'Application:FeaturesAvailabilityChanged',
  UnprotectedSessionExpired = 'Application:UnprotectedSessionExpired',
  /** Called when the app first launches and after first sync request made after sign in */
  CompletedInitialSync = 'Application:CompletedInitialSync',
  DidPurchaseSubscription = 'Application:DidPurchaseSubscription',
  SyncTooManyRequests = 'Application:SyncTooManyRequests',
}
