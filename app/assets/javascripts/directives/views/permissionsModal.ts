import { WebDirective } from './../../types';
import template from '%/directives/permissions-modal.pug';

class PermissionsModalCtrl {
  $element: JQLite;
  callback!: (success: boolean) => void;

  /* @ngInject */
  constructor($element: JQLite) {
    this.$element = $element;
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }

  accept() {
    this.callback(true);
    this.dismiss();
  }

  deny() {
    this.callback(false);
    this.dismiss();
  }
}

export class PermissionsModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = PermissionsModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      show: '=',
      component: '=',
      permissionsString: '=',
      callback: '=',
    };
  }
}
