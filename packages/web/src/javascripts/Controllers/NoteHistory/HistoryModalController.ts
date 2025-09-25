import { InternalEventBusInterface, SNNote } from '@standardnotes/snjs'
import { OPEN_NOTE_HISTORY_COMMAND } from '@standardnotes/ui-services'
import { action, makeObservable, observable } from 'mobx'
import { AbstractViewController } from '../Abstract/AbstractViewController'
import { NotesControllerInterface } from '../NotesController/NotesControllerInterface'
import { CommandService } from '../../Components/CommandPalette/CommandService'

export class HistoryModalController extends AbstractViewController {
  note?: SNNote = undefined

  override deinit(): void {
    super.deinit()
    this.note = undefined
  }

  constructor(
    notesController: NotesControllerInterface,
    commandService: CommandService,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      note: observable,
      setNote: action,
    })

    this.disposers.push(
      commandService.addWithShortcut(OPEN_NOTE_HISTORY_COMMAND, 'Current note', 'Open note history', () => {
        this.openModal(notesController.firstSelectedNote)
        return true
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
