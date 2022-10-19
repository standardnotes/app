import { FileItem, FileViewController, NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/Application/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'
import { ElementIds } from '@/Constants/ElementIDs'
import { FileDnDContext } from '@/Components/FileDragNDropProvider/FileDragNDropProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import ResponsivePaneContent from '../ResponsivePane/ResponsivePaneContent'
import FileView from '../FileView/FileView'
import NoteView from '../NoteView/NoteView'

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
}

class NoteGroupView extends PureComponent<Props, State> {
  static override contextType = FileDnDContext
  declare context: React.ContextType<typeof FileDnDContext>

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

    const canRenderEditorView = this.state.selectedPane === AppPaneId.Editor || !this.state.isInMobileView

    return (
      <div
        id={ElementIds.EditorColumn}
        className="app-column app-column-third flex min-h-screen flex-col pt-safe-top md:h-full md:min-h-0"
      >
        <ResponsivePaneContent paneId={AppPaneId.Editor} className="flex-grow">
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
          {shouldNotShowMultipleSelectedItems && hasControllers && canRenderEditorView && (
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
        </ResponsivePaneContent>
      </div>
    )
  }
}

export default NoteGroupView
