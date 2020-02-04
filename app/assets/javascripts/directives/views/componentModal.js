import template from '%/directives/component-modal.pug';

export class ComponentModalCtrl {
  /* @ngInject */
  constructor($scope, $element) {
    this.$element = $element;
    this.$scope = $scope;
  }

  dismiss(callback) {
    this.$element.remove();
    this.$scope.$destroy();
    if(this.onDismiss && this.onDismiss()) {
      this.onDismiss()(this.component);
    }
    callback && callback();
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
      onDismiss: '&'
    };
  }
}
