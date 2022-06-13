import { WebApplication } from '@/Application/Application'
import { ListGroup, RemoteRevisionListGroup } from '@/Components/RevisionHistoryModal/utils'
import { Action, NoteHistoryEntry } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class HistoryModalController {
  showRevisionHistoryModal = false

  remoteHistory: RemoteRevisionListGroup[] = []
  sessionHistory: ListGroup<NoteHistoryEntry>[] = []
  legacyHistory: Action[] = []

  constructor(private application: WebApplication) {
    makeObservable(this, {
      showRevisionHistoryModal: observable,
      setShowRevisionHistoryModal: action,

      remoteHistory: observable,
      sessionHistory: observable,
      legacyHistory: observable,
    })
  }

  setShowRevisionHistoryModal = (showRevisionHistoryModal: boolean) => {
    this.showRevisionHistoryModal = showRevisionHistoryModal
  }

  dismissModal = () => {
    this.setShowRevisionHistoryModal(false)
  }
}
