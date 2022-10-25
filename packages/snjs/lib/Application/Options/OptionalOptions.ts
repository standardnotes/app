export interface ApplicationSyncOptions {
  /**
   * The size of the item batch to decrypt and render upon application load.
   */
  loadBatchSize: number
}

export interface ApplicationDisplayOptions {
  supportsFileNavigation: boolean
}

export interface ApplicationOptionalConfiguratioOptions {
  /**
   * URL for WebSocket providing permissions and roles information.
   */
  webSocketUrl?: string
}
