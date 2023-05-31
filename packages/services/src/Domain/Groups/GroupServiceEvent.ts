export enum GroupServiceEvent {
  GroupStatusChanged = 'GroupStatusChanged',
  GroupMemberRemoved = 'GroupMemberRemoved',
}

export type GroupServiceEventPayload = {
  groupUuid: string
}
