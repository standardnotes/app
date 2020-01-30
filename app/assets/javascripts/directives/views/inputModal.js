import template from '%/directives/input-modal.pug';

class InputModalCtrl {

  /* @ngInject */
  constructor($scope, $element) {
    this.$element = $element;
    this.formData = {};
  }

  dismiss() {
    this.$element.remove();
    this.$scope.$destroy();
  }

  submit() {
    this.callback()(this.formData.input);
    this.dismiss();
  }
}

export class InputModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = InputModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      type: '=',
      title: '=',
      message: '=',
      placeholder: '=',
      callback: '&'
    };
  }
}
