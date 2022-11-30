import { FileItem } from '@standardnotes/snjs'
import { AbstractComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/Application/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import FileView from '../FileView/FileView'
import NoteView from '../NoteView/NoteView'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { FileViewController } from '../NoteView/Controller/FileViewController'

type State = {
  showMultipleSelectedNotes: boolean
  showMultipleSelectedFiles: boolean
  controllers: (NoteViewController | FileViewController)[]
  selectedFile: FileItem | undefined
  selectedPane?: AppPaneId
  isInMobileView?: boolean
}

type Props = {
  application: WebApplication
  className?: string
  innerRef: (ref: HTMLDivElement) => void
  id: string
}

class NoteGroupView extends AbstractComponent<Props, State> {
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

    const controllerGroup = this.application.itemControllerGroup
    this.removeChangeObserver = this.application.itemControllerGroup.addActiveControllerChangeObserver(() => {
      const controllers = controllerGroup.itemControllers
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

    this.autorun(() => {
      if (this.viewControllerManager && this.viewControllerManager.paneController) {
        this.setState({
          selectedPane: this.viewControllerManager.paneController.currentPane,
          isInMobileView: this.viewControllerManager.paneController.isInMobileView,
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

    const hasControllers = this.state.controllers.length > 0

    return (
      <div
        id={this.props.id}
        className={`app-column flex h-full flex-grow flex-col pt-safe-top ${this.props.className}`}
        ref={this.props.innerRef}
      >
        {this.state.showMultipleSelectedNotes && (
          <MultipleSelectedNotes
            application={this.application}
            selectionController={this.viewControllerManager.selectionController}
            navigationController={this.viewControllerManager.navigationController}
            notesController={this.viewControllerManager.notesController}
            linkingController={this.viewControllerManager.linkingController}
            historyModalController={this.viewControllerManager.historyModalController}
          />
        )}
        {this.state.showMultipleSelectedFiles && (
          <MultipleSelectedFiles
            filesController={this.viewControllerManager.filesController}
            selectionController={this.viewControllerManager.selectionController}
          />
        )}
        {shouldNotShowMultipleSelectedItems && hasControllers && (
          <>
            {this.state.controllers.map((controller) => {
              return controller instanceof NoteViewController ? (
                <NoteView key={controller.runtimeId} application={this.application} controller={controller} />
              ) : (
                <FileView
                  key={controller.runtimeId}
                  application={this.application}
                  viewControllerManager={this.viewControllerManager}
                  file={controller.item}
                />
              )
            })}
          </>
        )}
      </div>
    )
  }
}

export default NoteGroupView
