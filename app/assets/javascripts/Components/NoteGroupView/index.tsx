import { NoteViewController } from '@standardnotes/snjs'
import { PureComponent } from '@/Components/Abstract/PureComponent'
import { WebApplication } from '@/UIModels/Application'
import { MultipleSelectedNotes } from '@/Components/MultipleSelectedNotes'
import { NoteView } from '@/Components/NoteView/NoteView'
import { ElementIds } from '@/ElementIDs'

type State = {
  showMultipleSelectedNotes: boolean
  controllers: NoteViewController[]
}

type Props = {
  application: WebApplication
}

export class NoteGroupView extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props, props.application)
    this.state = {
      showMultipleSelectedNotes: false,
      controllers: [],
    }
  }

  override componentDidMount(): void {
    super.componentDidMount()
    this.application.noteControllerGroup.addActiveControllerChangeObserver(() => {
      this.setState({
        controllers: this.application.noteControllerGroup.noteControllers,
      })
    })
    this.autorun(() => {
      this.setState({
        showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1,
      })
    })
  }

  override render() {
    return (
      <div id={ElementIds.EditorColumn} className="h-full app-column app-column-third">
        {this.state.showMultipleSelectedNotes && (
          <MultipleSelectedNotes application={this.application} appState={this.appState} />
        )}

        {!this.state.showMultipleSelectedNotes && (
          <>
            {this.state.controllers.map((controller) => {
              return <NoteView application={this.application} controller={controller} />
            })}
          </>
        )}
      </div>
    )
  }
}
