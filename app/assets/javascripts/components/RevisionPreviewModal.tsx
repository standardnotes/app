import { ComponentViewer } from '@standardnotes/snjs/dist/@types';
import { WebApplication } from '@/ui_models/application';
import { ContentType, PayloadSource, SNNote } from '@standardnotes/snjs';
import { PayloadContent } from '@standardnotes/snjs';
import { confirmDialog } from '@/services/alertService';
import { STRING_RESTORE_LOCKED_ATTEMPT } from '@/strings';
import { PureComponent } from './Abstract/PureComponent';
import { ComponentView } from './ComponentView';

interface Props {
  application: WebApplication;
  content: PayloadContent;
  title?: string;
  uuid: string;
}

type State = {
  componentViewer?: ComponentViewer;
};

export class RevisionPreviewModal extends PureComponent<Props, State> {
  private originalNote!: SNNote;

  constructor(props: Props) {
    super(props, props.application);
  }

  async componentDidMount(): Promise<void> {
    super.componentDidMount();

    const templateNote = (await this.application.mutator.createTemplateItem(
      ContentType.Note,
      this.props.content
    )) as SNNote;

    this.originalNote = this.application.findItem(this.props.uuid) as SNNote;

    const component = this.application.componentManager.editorForNote(
      this.originalNote
    );
    if (component) {
      const componentViewer =
        this.application.componentManager.createComponentViewer(component);
      componentViewer.setReadonly(true);
      componentViewer.lockReadonly = true;
      componentViewer.overrideContextItem = templateNote;
      this.setState({ componentViewer });
    }
  }

  componentWillUnmount(): void {
    if (this.state.componentViewer) {
      this.application.componentManager.destroyComponentViewer(
        this.state.componentViewer
      );
    }
    super.componentWillUnmount();
  }

  restore = (asCopy: boolean) => {
    const run = async () => {
      if (asCopy) {
        await this.application.mutator.duplicateItem(this.originalNote, {
          ...this.props.content,
          title: this.props.content.title
            ? this.props.content.title + ' (copy)'
            : undefined,
        });
      } else {
        this.application.mutator.changeAndSaveItem(
          this.props.uuid,
          (mutator) => {
            mutator.unsafe_setCustomContent(this.props.content);
          },
          true,
          PayloadSource.RemoteActionRetrieved
        );
      }
      this.dismiss();
    };

    if (!asCopy) {
      if (this.originalNote.locked) {
        this.application.alertService.alert(STRING_RESTORE_LOCKED_ATTEMPT);
        return;
      }
      confirmDialog({
        text: "Are you sure you want to replace the current note's contents with what you see in this preview?",
        confirmButtonStyle: 'danger',
      }).then((confirmed) => {
        if (confirmed) {
          run();
        }
      });
    } else {
      run();
    }
  };

  dismiss = ($event?: Event) => {
    $event?.stopPropagation();
    this.dismissModal();
  };

  render() {
    return (
      <div className="sn-component">
        <div id="item-preview-modal" className="sk-modal medium">
          <div className="sk-modal-background" />
          <div className="sk-modal-content">
            <div className="sn-component">
              <div className="sk-panel">
                <div className="sk-panel-header">
                  <div>
                    <div className="sk-panel-header-title">Preview</div>
                    {this.props.title && (
                      <div className="sk-subtitle neutral mt-1">
                        {this.props.title}
                      </div>
                    )}
                  </div>

                  <div className="sk-horizontal-group">
                    <a
                      onClick={() => this.restore(false)}
                      className="sk-a info close-button"
                    >
                      Restore
                    </a>
                    <a
                      onClick={() => this.restore(true)}
                      className="sk-a info close-button"
                    >
                      Restore as copy
                    </a>
                    <a
                      onClick={this.dismiss}
                      className="sk-a info close-button"
                    >
                      Close
                    </a>
                  </div>
                </div>

                {!this.state.componentViewer && (
                  <div className="sk-panel-content selectable">
                    <div className="sk-h2">{this.props.content.title}</div>
                    <p
                      style="white-space: pre-wrap; font-size: 16px;"
                      className="normal sk-p"
                    >
                      {this.props.content.text}
                    </p>
                  </div>
                )}

                {this.state.componentViewer && (
                  <>
                    <div
                      style="height: auto; flex-grow: 0"
                      className="sk-panel-content sk-h2"
                    >
                      {this.props.content.title}
                    </div>
                    <div className="component-view">
                      <ComponentView
                        componentViewer={this.state.componentViewer}
                        application={this.application}
                        appState={this.appState}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
