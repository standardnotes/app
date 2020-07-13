import { WebDirective } from '../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/history-menu.pug';
import { SNItem, ItemHistoryEntry, ItemHistory } from '@node_modules/snjs/dist/@types';
import { PayloadSource } from 'snjs';

interface HistoryScope {
  application: WebApplication
  item: SNItem
}

class HistoryMenuCtrl implements HistoryScope {

  $timeout: ng.ITimeoutService
  diskEnabled = false
  autoOptimize = false
  fetchingServerHistory = false
  application!: WebApplication
  item!: SNItem
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

  async reloadHistory() {
    this.history = await this.application.historyManager!.historyForItem(this.item);
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

  get historySessionEntries() {
    return this.history.entries.filter((entry) => {
      return entry.payload.source === PayloadSource.SessionHistory;
    });
  }

  get historyServerEntries() {
    return this.history.entries.filter((entry) => {
      return entry.payload.source === PayloadSource.ServerHistory;
    });
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

  fetchServerHistory() {
    this.fetchingServerHistory = true;
    this.reloadHistory();
    this.fetchingServerHistory = false;
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
