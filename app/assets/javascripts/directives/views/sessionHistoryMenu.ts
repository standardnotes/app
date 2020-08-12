import { WebDirective } from './../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/session-history-menu.pug';
import { SNItem, ItemHistoryEntry, ItemHistory } from '@node_modules/snjs/dist/@types';
import { confirmDialog } from '@/services/alertService';

interface SessionHistoryScope {
  application: WebApplication
  item: SNItem
}

class SessionHistoryMenuCtrl implements SessionHistoryScope {

  $timeout: ng.ITimeoutService
  diskEnabled = false
  autoOptimize = false
  application!: WebApplication
  item!: SNItem
  entries!: ItemHistoryEntry[]
  history!: ItemHistory

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    this.$timeout = $timeout;
  }
  
  $onInit() {
    this.reloadHistory();
    this.diskEnabled = this.application.historyManager!.isDiskEnabled();
    this.autoOptimize = this.application.historyManager!.isAutoOptimizeEnabled();
  }

  reloadHistory() {
    const history = this.application.historyManager!.historyForItem(this.item);
    this.entries = history.entries.slice(0).sort((a, b) => {
      return a.payload.updated_at! < b.payload.updated_at! ? 1 : -1;
    });
    this.history = history;
  }

  openRevision(revision: ItemHistoryEntry) {
    this.application.presentRevisionPreviewModal(
      revision.payload.uuid, 
      revision.payload.content
    );
  }

  classForRevision(revision: ItemHistoryEntry) {
    const vector = revision.operationVector();
    if (vector === 0) {
      return 'default';
    } else if (vector === 1) {
      return 'success';
    } else if (vector === -1) {
      return 'danger';
    }
  }

  async clearItemHistory() {
    if (await confirmDialog({
      text: "Are you sure you want to delete the local session history for this note?",
      confirmButtonStyle: 'danger',
    })) {
      this.application.historyManager!.clearHistoryForItem(this.item).then(() => {
        this.$timeout(() => {
          this.reloadHistory();
        });
      });
    }
  }

  clearAllHistory() {
    if (confirmDialog({
      text: "Are you sure you want to delete the local session history for all notes?",
      confirmButtonStyle: 'danger'
    })) {
      this.application.historyManager!.clearAllHistory().then(() => {
        this.$timeout(() => {
          this.reloadHistory();
        });
      });
    }
  }

  async toggleDiskSaving() {
    const run = () => {
      this.application.historyManager!.toggleDiskSaving().then(() => {
        this.$timeout(() => {
          this.diskEnabled = this.application.historyManager!.isDiskEnabled();
        });
      });
    };
    if (!this.application.historyManager!.isDiskEnabled()) {
      if (await confirmDialog({
        text: `Are you sure you want to save history to disk? This will decrease general
        performance, especially as you type. You are advised to disable this feature
        if you experience any lagging.`,
        confirmButtonStyle: 'danger',
      })) {
        run();
      }
    } else {
      run();
    }
  }

  toggleAutoOptimize() {
    this.application.historyManager!.toggleAutoOptimize().then(() => {
      this.$timeout(() => {
        this.autoOptimize = this.application.historyManager!.autoOptimize;
      });
    });
  }
}

export class SessionHistoryMenu extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = SessionHistoryMenuCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      item: '=',
      application: '='
    };
  }
}
