import template from '%/directives/component-modal.pug';

export class ComponentModalCtrl {
  /* @ngInject */
  constructor($element) {
    this.$element = $element;
  }

  dismiss() {
    if(this.onDismiss) {
      this.onDismiss(this.component);
    }
    this.callback && this.callback();
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class ComponentModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = ComponentModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      show: '=',
      component: '=',
      callback: '=',
      onDismiss: '&',
      application: '='
    };
  }
}
