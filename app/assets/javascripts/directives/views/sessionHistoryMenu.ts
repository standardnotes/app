import { WebDirective } from './../../types';
import { WebApplication } from '@/application';
import template from '%/directives/session-history-menu.pug';
import { SNItem, ItemHistoryEntry, ItemHistory } from '@/../../../../snjs/dist/@types';

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

  clearItemHistory() {
    this.application.alertService!.confirm(
      "Are you sure you want to delete the local session history for this note?", 
      undefined,
      undefined,
      undefined,
      () => {
        this.application.historyManager!.clearHistoryForItem(this.item).then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      },
      undefined,
      true, 
    );
  }

  clearAllHistory() {
    this.application.alertService!.confirm(
      "Are you sure you want to delete the local session history for all notes?", 
      undefined,
      undefined,
      undefined,
      () => {
        this.application.historyManager!.clearAllHistory().then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      },
      undefined,
      true, 
    );
  }

  toggleDiskSaving() {
    const run = () => {
      this.application.historyManager!.toggleDiskSaving().then(() => {
        this.$timeout(() => {
          this.diskEnabled = this.application.historyManager!.isDiskEnabled();
        });
      });
    };
    if (!this.application.historyManager!.isDiskEnabled()) {
      this.application.alertService!.confirm(
        `Are you sure you want to save history to disk? This will decrease general 
        performance, especially as you type. You are advised to disable this feature 
        if you experience any lagging.`, 
        undefined,
        undefined,
        undefined,
        run,
        undefined,
        true, 
      );
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
