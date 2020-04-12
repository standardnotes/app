import { ApplicationManager } from './../applicationManager';
import { WebDirective } from './../types';
import template from '%/root.pug';
import { WebApplication } from '@/application';

class RootCtrl {

  private $timeout: ng.ITimeoutService
  private applicationManager: ApplicationManager
  public applications: WebApplication[] = []

  /* @ngInject */
  constructor($timeout: ng.ITimeoutService, applicationManager: ApplicationManager) {
    this.$timeout = $timeout;
    this.applicationManager = applicationManager;
    this.applicationManager.addApplicationChangeObserver(() => {
      this.reload();
    });
  }

  reload() {
    this.$timeout(() => {
      this.applications = this.applicationManager.getApplications();
    });
  }
}

export class Root extends WebDirective {
  constructor() {
    super();
    this.template = template;
    this.controller = RootCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
