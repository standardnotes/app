import template from '%/directives/sync-resolution-menu.pug';

class SyncResolutionMenuCtrl {
  /* @ngInject */
  constructor(
    $timeout
  ) {
    this.$timeout = $timeout;
    this.status = {};
  }

  downloadBackup(encrypted) {
    this.application.getArchiveService().downloadBackup(encrypted);
    this.status.backupFinished = true;
  }

  skipBackup() {
    this.status.backupFinished = true;
  }

  async performSyncResolution() {
    this.status.resolving = true;
    await this.application.resolveOutOfSync();
    this.$timeout(() => {
      this.status.resolving = false;
      this.status.attemptedResolution = true;
      if (this.application.getSyncStatus().isOutOfSync()) {
        this.status.fail = true;
      } else {
        this.status.success = true;
      }
    });
  }

  close() {
    this.$timeout(() => {
      this.closeFunction();
    });
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
      closeFunction: '&',
      application: '='
    };
  }
}
