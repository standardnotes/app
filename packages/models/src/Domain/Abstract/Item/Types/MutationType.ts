export enum MutationType {
  UpdateUserTimestamps = 1,
  /**
   * The item was changed as part of an internal operation, such as a migration, or, a user
   * interaction that shouldn't modify timestamps (pinning, protecting, etc).
   */
  NoUpdateUserTimestamps = 2,
  /**
   * The item was changed as part of an internal function that wishes to modify
   * internal item properties, such as lastSyncBegan, without modifying the item's dirty
   * state. By default all other mutation types will result in a dirtied result.
   */
  NonDirtying = 3,
}
