import { FileItem } from '@standardnotes/snjs'
import { AbstractComponent } from '@/Components/Abstract/PureComponent'
import MultipleSelectedNotes from '@/Components/MultipleSelectedNotes/MultipleSelectedNotes'
import MultipleSelectedFiles from '../MultipleSelectedFiles/MultipleSelectedFiles'
import { AppPaneId } from '../Panes/AppPaneMetadata'
import FileView from '../FileView/FileView'
import NoteView from '../NoteView/NoteView'
import { NoteViewController } from '../NoteView/Controller/NoteViewController'
import { FileViewController } from '../NoteView/Controller/FileViewController'
import { WebApplication } from '@/Application/WebApplication'
import { TabBar } from './TabBar'

type State = {
  showMultipleSelectedNotes: boolean
  showMultipleSelectedFiles: boolean
  controllers: (NoteViewController | FileViewController)[]
  activeControllerIndex: number
  splitControllerIndex: number | undefined
  focusedPane: 'primary' | 'secondary'
  selectedFile: FileItem | undefined
  selectedPane?: AppPaneId
  isInMobileView?: boolean
}

type Props = {
  application: WebApplication
  className?: string
}

class NoteGroupView extends AbstractComponent<Props, State> {
  private removeChangeObserver!: () => void

  constructor(props: Props) {
    super(props, props.application)
    const controllerGroup = props.application.itemControllerGroup
    this.state = {
      showMultipleSelectedNotes: false,
      showMultipleSelectedFiles: false,
      controllers: [],
      activeControllerIndex: controllerGroup.activeControllerIndex || 0,
      splitControllerIndex: controllerGroup.splitControllerIndex,
      focusedPane: controllerGroup.focusedPane || 'primary',
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
        activeControllerIndex: controllerGroup.activeControllerIndex,
        splitControllerIndex: controllerGroup.splitControllerIndex,
        focusedPane: controllerGroup.focusedPane,
      })
    })

    this.autorun(() => {
      if (this.application.notesController) {
        this.setState({
          showMultipleSelectedNotes: this.application.notesController.selectedNotesCount > 1,
        })
      }

      if (this.application.itemListController) {
        this.setState({
          showMultipleSelectedFiles: this.application.itemListController.selectedFilesCount > 1,
        })
      }
    })

    this.autorun(() => {
      if (this.application.itemListController) {
        this.setState({
          selectedFile: this.application.itemListController.selectedFiles[0],
        })
      }
    })

    this.autorun(() => {
      if (this.application.paneController) {
        this.setState({
          selectedPane: this.application.paneController.currentPane,
          isInMobileView: this.application.paneController.isInMobileView,
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
    const itemControllerGroup = this.application.itemControllerGroup

    const primaryController = this.state.controllers[this.state.activeControllerIndex]
    const secondaryController = this.state.splitControllerIndex !== undefined
      ? this.state.controllers[this.state.splitControllerIndex]
      : undefined

    const renderController = (controller: NoteViewController | FileViewController) => {
      return controller instanceof NoteViewController ? (
        <NoteView key={controller.runtimeId} application={this.application} controller={controller} />
      ) : (
        <FileView key={controller.runtimeId} application={this.application} file={controller.item} />
      )
    }

    return (
      <>
        {shouldNotShowMultipleSelectedItems && hasControllers && (
          <TabBar
            application={this.application}
            activeControllerIndex={this.state.activeControllerIndex}
            splitControllerIndex={this.state.splitControllerIndex}
            focusedPane={this.state.focusedPane}
            controllers={this.state.controllers}
          />
        )}

        {this.state.showMultipleSelectedNotes && <MultipleSelectedNotes application={this.application} />}
        {this.state.showMultipleSelectedFiles && (
          <MultipleSelectedFiles itemListController={this.application.itemListController} />
        )}

        {shouldNotShowMultipleSelectedItems && hasControllers && (
          <div className="flex-grow flex flex-col h-full overflow-hidden relative">
            {secondaryController !== undefined ? (
              <div className="editors-split-container flex-grow h-full">
                <div
                  className={`split-pane-wrapper h-full flex flex-col relative ${
                    this.state.focusedPane === 'primary' ? 'split-pane-focused' : ''
                  }`}
                  onClick={() => {
                    if (itemControllerGroup.focusedPane !== 'primary') {
                      itemControllerGroup.focusedPane = 'primary'
                      itemControllerGroup.notifyObservers()
                    }
                  }}
                >
                  <div className="split-pane-overlay" />
                  {primaryController && renderController(primaryController)}
                </div>
                <div
                  className={`split-pane-wrapper h-full flex flex-col relative ${
                    this.state.focusedPane === 'secondary' ? 'split-pane-focused' : ''
                  }`}
                  onClick={() => {
                    if (itemControllerGroup.focusedPane !== 'secondary') {
                      itemControllerGroup.focusedPane = 'secondary'
                      itemControllerGroup.notifyObservers()
                    }
                  }}
                >
                  <div className="split-pane-overlay" />
                  {renderController(secondaryController)}
                </div>
              </div>
            ) : (
              primaryController && renderController(primaryController)
            )}
          </div>
        )}
      </>
    )
  }
}

export default NoteGroupView
