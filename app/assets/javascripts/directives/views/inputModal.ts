import { WebDirective } from './../../types';
import template from '%/directives/input-modal.pug';

export interface InputModalScope extends Partial<ng.IScope> {
  type: string
  title: string
  message: string
  callback: (value: string) => void
}

class InputModalCtrl implements InputModalScope {

  $element: JQLite
  type!: string
  title!: string
  message!: string
  callback!: (value: string) => void
  formData = { input: '' }

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

  submit() {
    this.callback(this.formData.input);
    this.dismiss();
  }
}

export class InputModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = InputModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      type: '=',
      title: '=',
      message: '=',
      callback: '&'
    };
  }
}
