import { WebApplication } from '@/ui_models/application';
import { NoteHistoryEntry, SNNote } from '@standardnotes/snjs';
import { RevisionListEntry } from '@standardnotes/snjs';
import { alertDialog, confirmDialog } from '@/services/alertService';
import { PureComponent } from './Abstract/PureComponent';
import { MenuRow } from './MenuRow';

type HistoryState = {
  sessionHistory?: NoteHistoryEntry[];
  remoteHistory?: RevisionListEntry[];
  fetchingRemoteHistory: boolean;
  autoOptimize: boolean;
  diskEnabled: boolean;
  showRemoteOptions?: boolean;
  showSessionOptions?: boolean;
};

type Props = {
  application: WebApplication;
  item: SNNote;
};

export const React2AngularHistoryMenuPropsArray = ['application', 'item'];

export class HistoryMenu extends PureComponent<Props, HistoryState> {
  constructor(props: Props) {
    super(props, props.application);

    this.state = {
      fetchingRemoteHistory: false,
      autoOptimize: this.props.application.historyManager.autoOptimize,
      diskEnabled: this.props.application.historyManager.isDiskEnabled(),
      sessionHistory:
        this.props.application.historyManager.sessionHistoryForItem(
          this.props.item
        ) as NoteHistoryEntry[],
    };
  }

  reloadState() {
    this.setState({
      fetchingRemoteHistory: this.state.fetchingRemoteHistory,
      autoOptimize: this.props.application.historyManager.autoOptimize,
      diskEnabled: this.props.application.historyManager.isDiskEnabled(),
      sessionHistory:
        this.props.application.historyManager.sessionHistoryForItem(
          this.props.item
        ) as NoteHistoryEntry[],
    });
  }

  componentDidMount(): void {
    super.componentDidMount();
    this.fetchRemoteHistory();
  }

  fetchRemoteHistory = async () => {
    this.setState({ fetchingRemoteHistory: true });
    try {
      const remoteHistory =
        await this.props.application.historyManager.remoteHistoryForItem(
          this.props.item
        );
      this.setState({ remoteHistory });
    } finally {
      this.setState({ fetchingRemoteHistory: false });
    }
  };

  openSessionRevision = (revision: NoteHistoryEntry) => {
    this.props.application.presentRevisionPreviewModal(
      revision.payload.uuid,
      revision.payload.content,
      revision.previewTitle()
    );
  };

  openRemoteRevision = async (revision: RevisionListEntry) => {
    this.setState({ fetchingRemoteHistory: true });
    const remoteRevision =
      await this.props.application.historyManager.fetchRemoteRevision(
        this.props.item.uuid,
        revision
      );
    this.setState({ fetchingRemoteHistory: false });
    if (!remoteRevision) {
      alertDialog({
        text: 'The remote revision could not be loaded. Please try again later.',
      });
      return;
    }
    this.props.application.presentRevisionPreviewModal(
      remoteRevision.payload.uuid,
      remoteRevision.payload.content,
      this.previewRemoteHistoryTitle(revision)
    );
  };

  classForSessionRevision = (revision: NoteHistoryEntry) => {
    const vector = revision.operationVector();
    if (vector === 0) {
      return 'default';
    } else if (vector === 1) {
      return 'success';
    } else if (vector === -1) {
      return 'danger';
    }
  };

  clearItemSessionHistory = async () => {
    if (
      await confirmDialog({
        text: 'Are you sure you want to delete the local session history for this note?',
        confirmButtonStyle: 'danger',
      })
    ) {
      this.props.application.historyManager.clearHistoryForItem(
        this.props.item
      );
      this.reloadState();
    }
  };

  clearAllSessionHistory = async () => {
    if (
      await confirmDialog({
        text: 'Are you sure you want to delete the local session history for all notes?',
        confirmButtonStyle: 'danger',
      })
    ) {
      await this.props.application.historyManager.clearAllHistory();
      this.reloadState();
    }
  };

  toggleSessionHistoryDiskSaving = async () => {
    if (!this.state.diskEnabled) {
      if (
        await confirmDialog({
          text:
            'Are you sure you want to save history to disk? This will decrease general ' +
            'performance, especially as you type. You are advised to disable this feature ' +
            'if you experience any lagging.',
          confirmButtonStyle: 'danger',
        })
      ) {
        this.props.application.historyManager.toggleDiskSaving();
      }
    } else {
      this.props.application.historyManager.toggleDiskSaving();
    }
    this.reloadState();
  };

  toggleSessionHistoryAutoOptimize = () => {
    this.props.application.historyManager.toggleAutoOptimize();
    this.reloadState();
  };

  previewRemoteHistoryTitle(revision: RevisionListEntry) {
    return new Date(revision.created_at).toLocaleString();
  }

  toggleShowRemoteOptions = ($event: Event) => {
    $event.stopPropagation();
    this.setState({
      showRemoteOptions: !this.state.showRemoteOptions,
    });
  };

  toggleShowSessionOptions = ($event: Event) => {
    $event.stopPropagation();
    this.setState({
      showSessionOptions: !this.state.showSessionOptions,
    });
  };

  render() {
    return (
      <div id="history-menu" className="sn-component">
        <div className="sk-menu-panel dropdown-menu">
          <div className="sk-menu-panel-header">
            <div className="sk-menu-panel-header-title">
              Session
              <div className="sk-menu-panel-header-subtitle">
                {this.state.sessionHistory?.length || 'No'} revisions
              </div>
            </div>
            <a
              className="sk-a info sk-h5"
              onClick={this.toggleShowSessionOptions}
            >
              Options
            </a>
          </div>
          {this.state.showSessionOptions && (
            <div>
              <MenuRow
                action={this.clearItemSessionHistory}
                label="Clear note local history"
              />
              <MenuRow
                action={this.clearAllSessionHistory}
                label="Clear all local history"
              />
              <MenuRow
                action={this.toggleSessionHistoryAutoOptimize}
                label={
                  (this.state.autoOptimize ? 'Disable' : 'Enable') +
                  ' auto cleanup'
                }
              >
                <div className="sk-sublabel">
                  Automatically cleans up small revisions to conserve space.
                </div>
              </MenuRow>
              <MenuRow
                action={this.toggleSessionHistoryDiskSaving}
                label={
                  (this.state.diskEnabled ? 'Disable' : 'Enable') +
                  ' saving history to disk'
                }
              >
                <div className="sk-sublabel">
                  Saving to disk is not recommended. Decreases performance and
                  increases app loading time and memory footprint.
                </div>
              </MenuRow>
            </div>
          )}
          {this.state.sessionHistory?.map((revision, index) => {
            return (
              <MenuRow
                key={index}
                action={this.openSessionRevision}
                actionArgs={[revision]}
                label={revision.previewTitle()}
              >
                <div
                  className={
                    this.classForSessionRevision(revision) +
                    ' sk-sublabel opaque'
                  }
                >
                  {revision.previewSubTitle()}
                </div>
              </MenuRow>
            );
          })}
          <div className="sk-menu-panel-header">
            <div className="sk-menu-panel-header-title">
              Remote
              <div className="sk-menu-panel-header-subtitle">
                {this.state.remoteHistory?.length || 'No'} revisions
              </div>
            </div>
            <a
              onClick={this.toggleShowRemoteOptions}
              className="sk-a info sk-h5"
            >
              Options
            </a>
          </div>

          {this.state.showRemoteOptions && (
            <MenuRow
              action={this.fetchRemoteHistory}
              label="Refresh"
              disabled={this.state.fetchingRemoteHistory}
              spinnerClass={
                this.state.fetchingRemoteHistory ? 'info' : undefined
              }
            >
              <div className="sk-sublabel">Fetch history from server.</div>
            </MenuRow>
          )}
          {this.state.remoteHistory?.map((revision, index) => {
            return (
              <MenuRow
                key={index}
                action={this.openRemoteRevision}
                actionArgs={[revision]}
                label={this.previewRemoteHistoryTitle(revision)}
              />
            );
          })}
        </div>
      </div>
    );
  }
}
