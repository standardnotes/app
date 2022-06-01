import { NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/Application/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import NoteView from '@/Components/NoteView/NoteView'
import { ElementIds } from '@/Constants/ElementIDs'

type State = {
  showMultipleSelectedNotes: boolean
  controllers: NoteViewController[]
}

type Props = {
  application: WebApplication
}

class NoteGroupView extends PureComponent<Props, State> {
  private removeChangeObserver!: () => void

  constructor(props: Props) {
    super(props, props.application)
    this.state = {
      showMultipleSelectedNotes: false,
      controllers: [],
    }
  }

  override componentDidMount(): void {
    super.componentDidMount()

    const controllerGroup = this.application.noteControllerGroup
    this.removeChangeObserver = this.application.noteControllerGroup.addActiveControllerChangeObserver(() => {
      const controllers = controllerGroup.noteControllers
      this.setState({
        controllers: controllers,
      })
    })

    this.autorun(() => {
      if (this.viewControllerManager && this.viewControllerManager.notesController) {
        this.setState({
          showMultipleSelectedNotes: this.viewControllerManager.notesController.selectedNotesCount > 1,
        })
      }
    })
  }

  override deinit() {
    this.removeChangeObserver?.()
    ;(this.removeChangeObserver as unknown) = undefined

    super.deinit()
  }

  override render() {
    return (
      <div id={ElementIds.EditorColumn} className="h-full app-column app-column-third">
        {this.state.showMultipleSelectedNotes && (
          <MultipleSelectedNotes application={this.application} viewControllerManager={this.viewControllerManager} />
        )}

        {!this.state.showMultipleSelectedNotes && (
          <>
            {this.state.controllers.map((controller) => {
              return <NoteView key={controller.note.uuid} application={this.application} controller={controller} />
            })}
          </>
        )}
      </div>
    )
  }
}

export default NoteGroupView
