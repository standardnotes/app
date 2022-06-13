import { WebApplication } from '@/Application/Application'
import { ListGroup, RemoteRevisionListGroup } from '@/Components/RevisionHistoryModal/utils'
import { Action, NoteHistoryEntry } from '@standardnotes/snjs'
import { makeObservable, observable } from 'mobx'

export class HistoryModalViewController {
  showRevisionHistoryModal = false

  remoteHistory: RemoteRevisionListGroup[] = []
  sessionHistory: ListGroup<NoteHistoryEntry>[] = []
  legacyHistory: Action[] = []

  constructor(private application: WebApplication) {
    makeObservable(this, {
      showRevisionHistoryModal: observable,

      remoteHistory: observable,
      sessionHistory: observable,
      legacyHistory: observable,
    })
  }
}
