import { WebApplication } from '@/ui_models/application';
import { SNComponent } from 'snjs';
import { WebDirective } from './../../types';
import template from '%/directives/component-modal.pug';

type ComponentModalScope = {
  component: SNComponent
  callback: () => void
  onDismiss: (component: SNComponent) => void
  application: WebApplication
}

export class ComponentModalCtrl implements ComponentModalScope {
  $element: JQLite
  component!: SNComponent
  callback!: () => void
  onDismiss!: (component: SNComponent) => void
  application!: WebApplication
  
  /* @ngInject */
  constructor($element: JQLite) {
    this.$element = $element;
  }

  dismiss() {
    this.onDismiss && this.onDismiss(this.component);
    this.callback && this.callback();
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class ComponentModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = ComponentModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      component: '=',
      callback: '=',
      onDismiss: '&',
      application: '='
    };
  }
}
