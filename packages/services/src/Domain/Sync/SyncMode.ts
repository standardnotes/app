/* istanbul ignore file */

export enum SyncMode {
  /**
   * Performs a standard sync, uploading any dirty items and retrieving items.
   */
  Default = 'Default',
  /**
   * The first sync for an account, where we first want to download all remote items first
   * before uploading any dirty items. This allows a consumer, for example, to download
   * all data to see if user has an items key, and if not, only then create a new one.
   */
  DownloadFirst = 'DownloadFirst',
  LocalOnly = 'LocalOnly',
}
