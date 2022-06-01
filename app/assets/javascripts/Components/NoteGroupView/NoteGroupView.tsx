import { NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/UIModels/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import NoteView from '@/Components/NoteView/NoteView'
import { ElementIds } from '@/ElementIDs'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'

type State = {
  showMultipleSelectedNotes: boolean
  showMultipleSelectedFiles: boolean
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
      showMultipleSelectedFiles: false,
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
      if (!this.appState) {
        return
      }

      if (this.appState.notes) {
        this.setState({
          showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1,
        })
      }

      if (this.appState.files) {
        this.setState({
          showMultipleSelectedFiles: this.appState.files.selectedFilesCount > 1,
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
          <MultipleSelectedNotes application={this.application} appState={this.appState} />
        )}

        {this.state.showMultipleSelectedFiles && <MultipleSelectedFiles appState={this.appState} />}

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
