import { WebDirective } from '../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/history-menu.pug';
import { SNItem, ItemHistoryEntry, ItemHistory } from '@node_modules/snjs/dist/@types';
import { PureViewCtrl } from '@/views';

interface HistoryScope {
  application: WebApplication
  item: SNItem
}

class HistoryMenuCtrl extends PureViewCtrl implements HistoryScope {

  diskEnabled = false
  autoOptimize = false
  application!: WebApplication
  item!: SNItem
  sessionHistory?: ItemHistory
  serverHistory?: ItemHistory

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    super($timeout);
    this.state = {
      fetchingServerHistory: false
    };
  }
  
  $onInit() {
    super.$onInit();
    this.reloadHistory();
    this.fetchServerHistory();
    this.diskEnabled = this.application.historyManager!.isDiskEnabled();
    this.autoOptimize = this.application.historyManager!.isAutoOptimizeEnabled();
  }

  reloadHistory() {
    this.sessionHistory = this.application.historyManager!.sessionHistoryForItem(this.item);
  }

  get isFetchingServerHistory() {
    return this.state.fetchingServerHistory;
  }

  async fetchServerHistory() {
    this.setState({
      fetchingServerHistory: true
    });
    this.serverHistory = await this.application.historyManager!.serverHistoryForItem(this.item)
      .finally(() => {
        this.setState({
          fetchingServerHistory: false
        });
      });
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
      "Are you sure you want to delete the local session history for this note?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.application.historyManager!.clearHistoryForItem(this.item).then(() => {
        this.$timeout(() => {
          this.reloadHistory();
        });
      });
    });
  }

  clearAllHistory() {
    this.application.alertService!.confirm(
      "Are you sure you want to delete the local session history for all notes?"
    ).then((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.application.historyManager!.clearAllHistory().then(() => {
        this.$timeout(() => {
          this.reloadHistory();
        });
      });
    });
  }

  get historySessionEntries() {
    return this.sessionHistory?.entries;
  }

  get historyServerEntries() {
    return this.serverHistory?.entries
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
        "Are you sure you want to save history to disk? This will decrease general " +
        "performance, especially as you type. You are advised to disable this feature " +
        "if you experience any lagging."
      ).then((confirmed) => {
        if (confirmed) {
          run();
        }
      });
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
