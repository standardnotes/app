import { LegacyHistoryEntry, ListGroup, RemoteRevisionListGroup } from '@/Components/RevisionHistoryModal/utils'

import { Action, HistoryEntry, NoteHistoryEntry, RevisionMetadata } from '@standardnotes/snjs'

export type RemoteHistory = RemoteRevisionListGroup[]

export type SessionHistory = ListGroup<NoteHistoryEntry>[]

export type LegacyHistory = Action[]

export type SelectedRevision = HistoryEntry | LegacyHistoryEntry | undefined

export type SelectedEntry = RevisionMetadata | NoteHistoryEntry | Action | undefined

export enum RevisionContentState {
  Idle,
  Loading,
  Loaded,
  NotEntitled,
}
