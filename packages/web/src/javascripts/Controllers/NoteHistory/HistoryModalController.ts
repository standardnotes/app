import { InternalEventBusInterface, SNNote } from '@standardnotes/snjs'
import { KeyboardService, OPEN_NOTE_HISTORY_COMMAND } from '@standardnotes/ui-services'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { NotesControllerInterface } from '../NotesController/NotesControllerInterface'

export class HistoryModalController extends AbstractViewController {
  note?: SNNote = undefined

  override deinit(): void {
    super.deinit()
    this.note = undefined
  }

  constructor(
    notesController: NotesControllerInterface,
    keyboardService: KeyboardService,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      note: observable,
      setNote: action,
    })

    this.disposers.push(
      keyboardService.addCommandHandler({
        command: OPEN_NOTE_HISTORY_COMMAND,
        category: 'Current note',
        description: 'Open note history',
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
