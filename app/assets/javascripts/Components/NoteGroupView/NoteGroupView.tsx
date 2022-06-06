import { FileItem, NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/Application/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import NoteView from '@/Components/NoteView/NoteView'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'
import { ElementIds } from '@/Constants/ElementIDs'
import FileView from '@/Components/FileView/FileView'

type State = {
  showMultipleSelectedNotes: boolean
  showMultipleSelectedFiles: boolean
  controllers: NoteViewController[]
  selectedFile: FileItem | undefined
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
      selectedFile: undefined,
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
      if (!this.viewControllerManager) {
        return
      }

      if (this.viewControllerManager && this.viewControllerManager.notesController) {
        this.setState({
          showMultipleSelectedNotes: this.viewControllerManager.notesController.selectedNotesCount > 1,
        })
      }

      if (this.viewControllerManager.selectionController) {
        this.setState({
          showMultipleSelectedFiles: this.viewControllerManager.selectionController.selectedFilesCount > 1,
        })
      }
    })

    this.autorun(() => {
      if (this.viewControllerManager && this.viewControllerManager.selectionController) {
        this.setState({
          selectedFile: this.viewControllerManager.selectionController.selectedFiles[0],
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
    const shouldNotShowMultipleSelectedItems =
      !this.state.showMultipleSelectedNotes && !this.state.showMultipleSelectedFiles

    return (
      <div id={ElementIds.EditorColumn} className="h-full app-column app-column-third">
        {this.state.showMultipleSelectedNotes && (
          <MultipleSelectedNotes application={this.application} viewControllerManager={this.viewControllerManager} />
        )}

        {this.state.showMultipleSelectedFiles && (
          <MultipleSelectedFiles
            filesController={this.viewControllerManager.filesController}
            selectionController={this.viewControllerManager.selectionController}
          />
        )}

        {shouldNotShowMultipleSelectedItems && this.state.controllers.length > 0 && (
          <>
            {this.state.controllers.map((controller) => {
              return <NoteView key={controller.note.uuid} application={this.application} controller={controller} />
            })}
          </>
        )}

        {shouldNotShowMultipleSelectedItems && this.state.controllers.length < 1 && this.state.selectedFile && (
          <FileView
            application={this.application}
            viewControllerManager={this.viewControllerManager}
            file={this.state.selectedFile}
          />
        )}
      </div>
    )
  }
}

export default NoteGroupView
