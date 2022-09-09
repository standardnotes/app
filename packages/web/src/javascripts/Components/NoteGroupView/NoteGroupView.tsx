import { FileItem, FileViewController, NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/Application/Application'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import NoteView from '@/Components/NoteView/NoteView'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'
import { ElementIds } from '@/Constants/ElementIDs'
import FileView from '@/Components/FileView/FileView'
import { FileDnDContext } from '@/Components/FileDragNDropProvider/FileDragNDropProvider'
import { AppPaneId } from '../ResponsivePane/AppPaneMetadata'
import ResponsivePaneContent from '../ResponsivePane/ResponsivePaneContent'
import Icon from '../Icon/Icon'
import { useResponsiveAppPane } from '../ResponsivePane/ResponsivePaneProvider'

const MobileItemsListButton = () => {
  const { toggleAppPane } = useResponsiveAppPane()

  return (
    <div className="px-3.5 pt-2.5 md:hidden">
      <button
        className="bg-text-padding flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-border text-neutral hover:bg-contrast focus:bg-contrast"
        onClick={() => {
          toggleAppPane(AppPaneId.Items)
        }}
        title="Go to items list"
        aria-label="Go to items list"
      >
        <Icon type="chevron-left" />
      </button>
    </div>
  )
}

type State = {
  showMultipleSelectedNotes: boolean
  showMultipleSelectedFiles: boolean
  controllers: (NoteViewController | FileViewController)[]
  selectedFile: FileItem | undefined
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
  }

  override deinit() {
    this.removeChangeObserver?.()
    ;(this.removeChangeObserver as unknown) = undefined

    super.deinit()
  }

  override render() {
    const fileDragNDropContext = this.context

    const shouldNotShowMultipleSelectedItems =
      !this.state.showMultipleSelectedNotes && !this.state.showMultipleSelectedFiles

    return (
      <div id={ElementIds.EditorColumn} className="app-column app-column-third h-full">
        <ResponsivePaneContent paneId={AppPaneId.Editor}>
          <MobileItemsListButton />
          {this.state.showMultipleSelectedNotes && (
            <MultipleSelectedNotes
              application={this.application}
              filesController={this.viewControllerManager.filesController}
              selectionController={this.viewControllerManager.selectionController}
              featuresController={this.viewControllerManager.featuresController}
              filePreviewModalController={this.viewControllerManager.filePreviewModalController}
              navigationController={this.viewControllerManager.navigationController}
              notesController={this.viewControllerManager.notesController}
              noteTagsController={this.viewControllerManager.noteTagsController}
              historyModalController={this.viewControllerManager.historyModalController}
            />
          )}
          {this.state.showMultipleSelectedFiles && (
            <MultipleSelectedFiles
              filesController={this.viewControllerManager.filesController}
              selectionController={this.viewControllerManager.selectionController}
            />
          )}
          {this.viewControllerManager.navigationController.isInFilesView && fileDragNDropContext?.isDraggingFiles && (
            <div className="absolute bottom-8 left-1/2 z-dropdown-menu -translate-x-1/2 rounded bg-info px-5 py-3 text-info-contrast shadow-main">
              Drop your files to upload them
            </div>
          )}
          {shouldNotShowMultipleSelectedItems && this.state.controllers.length > 0 && (
            <>
              {this.state.controllers.map((controller) => {
                return controller instanceof NoteViewController ? (
                  <NoteView key={controller.item.uuid} application={this.application} controller={controller} />
                ) : (
                  <FileView
                    key={controller.item.uuid}
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
