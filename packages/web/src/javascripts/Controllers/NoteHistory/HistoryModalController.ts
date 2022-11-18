import { WebApplication } from '@/Application/Application'
import { InternalEventBus, SNNote } from '@standardnotes/snjs'
import { OPEN_NOTE_HISTORY_COMMAND } from '@standardnotes/ui-services'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { NotesControllerInterface } from '../NotesController/NotesControllerInterface'

export class HistoryModalController extends AbstractViewController {
  note?: SNNote = undefined

  override deinit(): void {
    super.deinit()
    this.note = undefined
  }

  constructor(application: WebApplication, eventBus: InternalEventBus, notesController: NotesControllerInterface) {
    super(application, eventBus)

    makeObservable(this, {
      note: observable,
      setNote: action,
    })

    this.disposers.push(
      application.keyboardService.addCommandHandler({
        command: OPEN_NOTE_HISTORY_COMMAND,
        onKeyDown: () => {
          this.openModal(notesController.firstSelectedNote)
          return true
        },
      }),
    )
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
