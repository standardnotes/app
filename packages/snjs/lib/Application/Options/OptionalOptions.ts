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
   * Gives consumers the ability to provide their own custom
   * subclass for a service. swapClasses should be an array of key/value pairs
   * consisting of keys 'swap' and 'with'. 'swap' is the base class you wish to replace,
   * and 'with' is the custom subclass to use.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  swapClasses?: { swap: any; with: any }[]
  /**
   * URL for WebSocket providing permissions and roles information.
   */
  webSocketUrl?: string
}
