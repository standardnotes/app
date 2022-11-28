export interface ApplicationSyncOptions {
  /**
   * The size of the item batch to decrypt and render upon application load.
   */
  loadBatchSize: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ApplicationDisplayOptions {}

export interface ApplicationOptionalConfiguratioOptions {
  /**
   * URL for WebSocket providing permissions and roles information.
   */
  webSocketUrl?: string
}
