import { WebDirective } from '../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/history-menu.pug';
import { SNItem, ItemHistoryEntry } from '@standardnotes/snjs';
import { PureViewCtrl } from '@/views';
import { ItemSessionHistory } from '@standardnotes/snjs';
import { RevisionListEntry, SingleRevision } from '@standardnotes/snjs';
import { confirmDialog } from '@/services/alertService';

type HistoryState = {
  fetchingRemoteHistory: boolean
}

interface HistoryScope {
  application: WebApplication
  item: SNItem
}

class HistoryMenuCtrl extends PureViewCtrl<{}, HistoryState> implements HistoryScope {

  diskEnabled = false
  autoOptimize = false
  application!: WebApplication
  item!: SNItem
  sessionHistory?: ItemSessionHistory
  remoteHistory?: RevisionListEntry[]

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.state = {
      fetchingRemoteHistory: false
    };
  }

  $onInit() {
    super.$onInit();
    this.reloadSessionHistory();
    this.fetchRemoteHistory();
    this.diskEnabled = this.application.historyManager!.isDiskEnabled();
    this.autoOptimize = this.application.historyManager!.isAutoOptimizeEnabled();
  }

  reloadSessionHistory() {
    this.sessionHistory = this.application.historyManager!.sessionHistoryForItem(this.item);
  }

  get isfetchingRemoteHistory() {
    return this.state.fetchingRemoteHistory;
  }

  set fetchingRemoteHistory(value: boolean) {
    this.setState({
      fetchingRemoteHistory: value
    });
  }

  async fetchRemoteHistory() {
    this.fetchingRemoteHistory = true;
    this.remoteHistory = await this.application.historyManager!.remoteHistoryForItem(this.item)
      .finally(() => {
        this.fetchingRemoteHistory = false;
      });
  }

  async openSessionRevision(revision: ItemHistoryEntry) {
    this.application.presentRevisionPreviewModal(
      revision.payload.uuid,
      revision.payload.content
    );
  }

  async openRemoteRevision(revision: RevisionListEntry) {
    this.fetchingRemoteHistory = true;
    const remoteRevision = await this.application.historyManager!.fetchRemoteRevision(this.item.uuid, revision);
    this.fetchingRemoteHistory = false;
    if (!remoteRevision) {
      this.application.alertService!.alert("The remote revision could not be loaded. Please try again later.");
      return;
    }
    this.application.presentRevisionPreviewModal(
      remoteRevision.payload.uuid,
      remoteRevision.payload.content
    );
  }

  classForSessionRevision(revision: ItemHistoryEntry) {
    const vector = revision.operationVector();
    if (vector === 0) {
      return 'default';
    } else if (vector === 1) {
      return 'success';
    } else if (vector === -1) {
      return 'danger';
    }
  }

  clearItemSessionHistory() {
    confirmDialog({
      text: "Are you sure you want to delete the local session history for this note?",
      confirmButtonStyle: "danger"
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.application.historyManager!.clearHistoryForItem(this.item).then(() => {
        this.$timeout(() => {
          this.reloadSessionHistory();
        });
      });
    });
  }

  clearAllSessionHistory() {
    confirmDialog({
      text: "Are you sure you want to delete the local session history for all notes?",
      confirmButtonStyle: "danger"
    }).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.application.historyManager!.clearAllHistory().then(() => {
        this.$timeout(() => {
          this.reloadSessionHistory();
        });
      });
    });
  }

  get sessionHistoryEntries() {
    return this.sessionHistory?.entries;
  }

  get remoteHistoryEntries() {
    return this.remoteHistory;
  }

  toggleSessionHistoryDiskSaving() {
    const run = () => {
      this.application.historyManager!.toggleDiskSaving().then(() => {
        this.$timeout(() => {
          this.diskEnabled = this.application.historyManager!.isDiskEnabled();
        });
      });
    };
    if (!this.application.historyManager!.isDiskEnabled()) {
      confirmDialog({
        text: "Are you sure you want to save history to disk? This will decrease general " +
        "performance, especially as you type. You are advised to disable this feature " +
        "if you experience any lagging.",
        confirmButtonStyle: "danger"
      }).then((confirmed) => {
        if (confirmed) {
          run();
        }
      });
    } else {
      run();
    }
  }

  toggleSessionHistoryAutoOptimize() {
    this.application.historyManager!.toggleAutoOptimize().then(() => {
      this.$timeout(() => {
        this.autoOptimize = this.application.historyManager!.autoOptimize;
      });
    });
  }

  previewRemoteHistoryTitle(revision: SingleRevision) {
    const createdAt = revision.created_at!;
    return new Date(createdAt).toLocaleString();
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
      application: '='
    };
  }
}
