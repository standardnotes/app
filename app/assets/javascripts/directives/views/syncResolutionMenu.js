import template from '%/directives/sync-resolution-menu.pug';

class SyncResolutionMenuCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    archiveManager,
    syncManager,
  ) {
    this.$timeout = $timeout;
    this.archiveManager = archiveManager;
    this.syncManager = syncManager;
    this.status = {};
  }

  downloadBackup(encrypted) {
    this.archiveManager.downloadBackup(encrypted);
    this.status.backupFinished = true;
  }

  skipBackup() {
    this.status.backupFinished = true;
  }

  async performSyncResolution() {
    this.status.resolving = true;
    await this.syncManager.resolveOutOfSync();
    this.$timeout(() => {
      this.status.resolving = false;
      this.status.attemptedResolution = true;
      if (this.syncManager.isOutOfSync()) {
        this.status.fail = true;
      } else {
        this.status.success = true;
      }
    })
  }

  close() {
    this.$timeout(() => {
      this.closeFunction()();
    })
  }
}

export class SyncResolutionMenu {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = SyncResolutionMenuCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      closeFunction: '&'
    };
  }
}
