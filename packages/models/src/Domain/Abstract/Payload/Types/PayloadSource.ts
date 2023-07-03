export enum PayloadSource {
  /**
   * Payloads with a source of Constructor means that the payload was created
   * in isolated space by the caller, and does not yet have any app-related affiliation.
   */
  Constructor = 1,

  LocalDatabaseLoaded = 2,

  RemoteRetrieved,

  RemoteSaved,

  FileImport,
}
