import template from '%/root.pug';

class RootCtrl {
  /* @ngInject */
  constructor($timeout, applicationManager) {
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

export class Root {
  constructor() {
    this.template = template;
    this.controller = RootCtrl;
    this.replace = true;
    this.controllerAs = 'self';
    this.bindToController = true;
  }
}
