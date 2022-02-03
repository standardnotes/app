import { NoteViewController } from '@standardnotes/snjs';
import { PureComponent } from '@/components/Abstract/PureComponent';
import { WebApplication } from '@/ui_models/application';
import { MultipleSelectedNotes } from '@/components/MultipleSelectedNotes';
import { NoteView } from '@/components/NoteView/NoteView';
import { ElementIds } from '@/element_ids';

type State = {
  showMultipleSelectedNotes: boolean;
  controllers: NoteViewController[];
};

type Props = {
  application: WebApplication;
};

export class NoteGroupView extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props, props.application);
    this.state = {
      showMultipleSelectedNotes: false,
      controllers: [],
    };
  }

  componentDidMount(): void {
    super.componentDidMount();
    this.application.noteControllerGroup.addActiveControllerChangeObserver(
      () => {
        this.setState({
          controllers: this.application.noteControllerGroup.noteControllers,
        });
      }
    );
    this.autorun(() => {
      this.setState({
        showMultipleSelectedNotes: this.appState.notes.selectedNotesCount > 1,
      });
    });
  }

  render() {
    return (
      <div
        id={ElementIds.EditorColumn}
        className="h-full app-column app-column-third"
      >
        {this.state.showMultipleSelectedNotes && (
          <MultipleSelectedNotes
            application={this.application}
            appState={this.appState}
          />
        )}

        {!this.state.showMultipleSelectedNotes && (
          <>
            {this.state.controllers.map((controller) => {
              return (
                <NoteView
                  application={this.application}
                  controller={controller}
                />
              );
            })}
          </>
        )}
      </div>
    );
  }
}
