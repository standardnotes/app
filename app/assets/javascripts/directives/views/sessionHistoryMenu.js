import template from '%/directives/session-history-menu.pug';

class SessionHistoryMenuCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    godService,
    application,
  ) {
    this.$timeout = $timeout;
    this.godService = godService;
    this.application = application;
    this.diskEnabled = this.application.historyManager.isDiskEnabled();
    this.autoOptimize = this.application.historyManager.isAutoOptimizeEnabled();
  }
  
  $onInit() {
    this.reloadHistory();
  }

  reloadHistory() {
    const history = this.application.historyManager.historyForItem(this.item);
    this.entries = history.entries.slice(0).sort((a, b) => {
      return a.item.updated_at < b.item.updated_at ? 1 : -1;
    });
    this.history = history;
  }

  openRevision(revision) {
    this.godService.presentRevisionPreviewModal(
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
    this.application.alertService.confirm({
      text: "Are you sure you want to delete the local session history for this note?", 
      destructive: true, 
      onConfirm: () => {
        this.application.historyManager.clearHistoryForItem(this.item).then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      }
    });
  }

  clearAllHistory() {
    this.application.alertService.confirm({
      text: "Are you sure you want to delete the local session history for all notes?", 
      destructive: true, 
      onConfirm: () => {
        this.application.historyManager.clearAllHistory().then(() => {
          this.$timeout(() => {
            this.reloadHistory();
          });
        });
      }
    });
  }

  toggleDiskSaving() {
    const run = () => {
      this.application.historyManager.toggleDiskSaving().then(() => {
        this.$timeout(() => {
          this.diskEnabled = this.application.historyManager.diskEnabled;
        });
      });
    };
    if (!this.application.historyManager.diskEnabled) {
      this.application.alertService.confirm({
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
    this.application.historyManager.toggleAutoOptimize().then(() => {
      this.$timeout(() => {
        this.autoOptimize = this.application.historyManager.autoOptimize;
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
