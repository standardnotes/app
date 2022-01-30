import { NoteViewController } from '@standardnotes/snjs';
import { PureComponent } from '@/components/Abstract/PureComponent';
import { WebApplication } from '@/ui_models/application';
import { MultipleSelectedNotes } from '@/components/MultipleSelectedNotes';
import { NoteView } from '@/components/NoteView/NoteView';

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
      <div className="h-full">
        {this.state.showMultipleSelectedNotes && (
          <div className="h-full">
            <MultipleSelectedNotes
              application={this.application}
              appState={this.appState}
            />
          </div>
        )}

        {!this.state.showMultipleSelectedNotes && (
          <>
            {this.state.controllers.map((controller) => {
              return (
                <div className="flex-grow h-full">
                  <NoteView
                    application={this.application}
                    controller={controller}
                  />
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  }
}
