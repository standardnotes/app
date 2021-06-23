import { WebDirective } from '../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/history-menu.pug';
import { HistoryEntry, SNItem } from '@standardnotes/snjs';
import { PureViewCtrl } from '@/views';
import { RevisionListEntry, SingleRevision } from '@standardnotes/snjs';
import { alertDialog, confirmDialog } from '@/services/alertService';

type HistoryState = {
  sessionHistory?: HistoryEntry[];
  remoteHistory?: RevisionListEntry[];
  fetchingRemoteHistory: boolean;
  autoOptimize: boolean;
  diskEnabled: boolean;
};

class HistoryMenuCtrl extends PureViewCtrl<unknown, HistoryState> {
  application!: WebApplication;
  item!: SNItem;

  /** @template */
  showSessionOptions = false;

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService) {
    super($timeout);
  }

  getInitialState() {
    return {
      fetchingRemoteHistory: false,
      autoOptimize: this.application.historyManager.autoOptimize,
      diskEnabled: this.application.historyManager.isDiskEnabled(),
      sessionHistory: this.application.historyManager.sessionHistoryForItem(
        this.item
      ),
    };
  }

  reloadState() {
    this.setState({
      ...this.getInitialState(),
      fetchingRemoteHistory: this.state.fetchingRemoteHistory,
    });
  }

  $onInit() {
    super.$onInit();
    this.fetchRemoteHistory();
  }

  async fetchRemoteHistory() {
    this.setState({ fetchingRemoteHistory: true });
    try {
      const remoteHistory = await this.application.historyManager.remoteHistoryForItem(
        this.item
      );
      this.setState({ remoteHistory });
    } finally {
      this.setState({ fetchingRemoteHistory: false });
    }
  }

  async openSessionRevision(revision: HistoryEntry & { previewTitle: () => string }) {
    this.application.presentRevisionPreviewModal(
      revision.payload.uuid,
      revision.payload.content,
      revision.previewTitle()
    );
  }

  async openRemoteRevision(revision: RevisionListEntry) {
    this.setState({ fetchingRemoteHistory: true });
    const remoteRevision = await this.application.historyManager.fetchRemoteRevision(
      this.item.uuid,
      revision
    );
    this.setState({ fetchingRemoteHistory: false });
    if (!remoteRevision) {
      alertDialog({
        text:
          'The remote revision could not be loaded. Please try again later.',
      });
      return;
    }
    this.application.presentRevisionPreviewModal(
      remoteRevision.payload.uuid,
      remoteRevision.payload.content,
      this.previewRemoteHistoryTitle(revision)
    );
  }

  classForSessionRevision(revision: HistoryEntry) {
    const vector = revision.operationVector();
    if (vector === 0) {
      return 'default';
    } else if (vector === 1) {
      return 'success';
    } else if (vector === -1) {
      return 'danger';
    }
  }

  async clearItemSessionHistory() {
    if (
      await confirmDialog({
        text:
          'Are you sure you want to delete the local session history for this note?',
        confirmButtonStyle: 'danger',
      })
    ) {
      this.application.historyManager.clearHistoryForItem(this.item);
      this.reloadState();
    }
  }

  async clearAllSessionHistory() {
    if (
      await confirmDialog({
        text:
          'Are you sure you want to delete the local session history for all notes?',
        confirmButtonStyle: 'danger',
      })
    ) {
      await this.application.historyManager.clearAllHistory();
      this.reloadState();
    }
  }

  /** @entries */
  get sessionHistoryEntries() {
    return this.state.sessionHistory;
  }

  async toggleSessionHistoryDiskSaving() {
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
        this.application.historyManager.toggleDiskSaving();
      }
    } else {
      this.application.historyManager.toggleDiskSaving();
    }
    this.reloadState();
  }

  toggleSessionHistoryAutoOptimize() {
    this.application.historyManager.toggleAutoOptimize();
    this.reloadState();
  }

  previewRemoteHistoryTitle(revision: RevisionListEntry) {
    return new Date(revision.created_at).toLocaleString();
  }
}

export class HistoryMenu extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = HistoryMenuCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      item: '=',
      application: '=',
    };
  }
}
