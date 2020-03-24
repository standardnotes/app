import template from '%/directives/input-modal.pug';

class InputModalCtrl {

  /* @ngInject */
  constructor($element) {
    this.$element = $element;
    this.formData = {};
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
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
