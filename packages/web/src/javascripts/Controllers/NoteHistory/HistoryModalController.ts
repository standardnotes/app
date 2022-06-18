import { WebApplication } from '@/Application/Application'
import { InternalEventBus, SNNote } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'

export class HistoryModalController extends AbstractViewController {
  note?: SNNote = undefined

  override deinit(): void {
    super.deinit()
    this.note = undefined
  }

  constructor(application: WebApplication, eventBus: InternalEventBus) {
    super(application, eventBus)

    makeObservable(this, {
      note: observable,
      setNote: action,
    })
  }

  setNote = (note: SNNote | undefined) => {
    this.note = note
  }

  openModal = (note: SNNote | undefined) => {
    this.setNote(note)
  }

  dismissModal = () => {
    this.setNote(undefined)
  }
}
