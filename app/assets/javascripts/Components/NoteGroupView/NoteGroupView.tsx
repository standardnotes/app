import { NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/UIModels/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import NoteView from '@/Components/NoteView/NoteView'
import { ElementIds } from '@/ElementIDs'
import { IlNotesIcon } from '@standardnotes/icons'

type State = {
  showMultipleSelectedNotes: boolean
  isDraggingFiles: boolean
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
      isDraggingFiles: false,
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

      if (this.appState.filesDragService) {
        this.setState({
          isDraggingFiles: this.appState.filesDragService.isDraggingFiles,
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

        {this.state.controllers.length < 1 && this.state.isDraggingFiles && (
          <div
            className="w-full h-full flex flex-col justify-center items-center"
            style={{ border: '2px dashed var(--sn-stylekit-info-color)' }}
          >
            <IlNotesIcon className="block" />
            <h2 className="text-lg m-0 text-center mt-4">Drop your files to upload</h2>
          </div>
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
