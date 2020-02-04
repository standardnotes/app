import template from '%/directives/session-history-menu.pug';

class SessionHistoryMenuCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    actionsManager,
    alertManager,
    sessionHistory,
  ) {
    this.$timeout = $timeout;
    this.alertManager = alertManager;
    this.actionsManager = actionsManager;
    this.sessionHistory = sessionHistory;
    this.diskEnabled = this.sessionHistory.diskEnabled;
    this.autoOptimize = this.sessionHistory.autoOptimize;
  }
  
  $onInit() {
    this.reloadHistory();
  }

  reloadHistory() {
    const history = this.sessionHistory.historyForItem(this.item);
    this.entries = history.entries.slice(0).sort((a, b) => {
      return a.item.updated_at < b.item.updated_at ? 1 : -1;
    });
    this.history = history;
  }

  openRevision(revision) {
    this.actionsManager.presentRevisionPreviewModal(
      revision.item.uuid, 
      revision.item.content
    );
  }

  classForRevision(revision) {
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
    this.alertManager.confirm({
      text: "Are you sure you want to delete the local session history for this note?", 
      destructive: true, 
      onConfirm: () => {
        this.sessionHistory.clearHistoryForItem(this.item).then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      }
    });
  }

  clearAllHistory() {
    this.alertManager.confirm({
      text: "Are you sure you want to delete the local session history for all notes?", 
      destructive: true, 
      onConfirm: () => {
        this.sessionHistory.clearAllHistory().then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      }
    });
  }

  toggleDiskSaving() {
    const run = () => {
      this.sessionHistory.toggleDiskSaving().then(() => {
        this.$timeout(() => {
          this.diskEnabled = this.sessionHistory.diskEnabled;
        });
      });
    };
    if (!this.sessionHistory.diskEnabled) {
      this.alertManager.confirm({
        text: `Are you sure you want to save history to disk? This will decrease general 
        performance, especially as you type. You are advised to disable this feature 
        if you experience any lagging.`, 
        destructive: true, 
        onConfirm: run
      });
    } else {
      run();
    }
  }

  toggleAutoOptimize() {
    this.sessionHistory.toggleAutoOptimize().then(() => {
      this.$timeout(() => {
        this.autoOptimize = this.sessionHistory.autoOptimize;
      });
    });
  }
}

export class SessionHistoryMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = SessionHistoryMenuCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      item: '='
    };
  }
}
