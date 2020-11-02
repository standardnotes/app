import { WebApplication } from '@/ui_models/application';
import { WebDirective } from './../../types';
import template from '%/directives/sync-resolution-menu.pug';

class SyncResolutionMenuCtrl {

  closeFunction!: () => void
  application!: WebApplication

  $timeout: ng.ITimeoutService
  status: Partial<{
    backupFinished: boolean,
    resolving: boolean,
    attemptedResolution: boolean,
    success: boolean
    fail: boolean
  }> = {}

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService
  ) {
    this.$timeout = $timeout;
  }

  downloadBackup(encrypted: boolean) {
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
      if (this.application.isOutOfSync()) {
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

export class SyncResolutionMenu extends WebDirective {
  constructor() {
    super();
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
