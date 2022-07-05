export enum ConflictStrategy {
  KeepBase = 1,
  KeepApply = 2,
  KeepBaseDuplicateApply = 3,
  DuplicateBaseKeepApply = 4,
  KeepBaseMergeRefs = 5,
}
