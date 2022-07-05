/* istanbul ignore file */

export enum SyncQueueStrategy {
  /**
   * Promise will be resolved on the next sync request after the current one completes.
   * If there is no scheduled sync request, one will be scheduled.
   */
  ResolveOnNext = 1,
  /**
   * A new sync request is guarenteed to be generated for your request, no matter how long it takes.
   * Promise will be resolved whenever this sync request is processed in the serial queue.
   */
  ForceSpawnNew = 2,
}
