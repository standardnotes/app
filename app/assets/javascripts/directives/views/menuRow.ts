import { WebDirective } from './../../types';
import template from '%/directives/menu-row.pug';

class MenuRowCtrl {

  disabled!: boolean
  action!: () => void
  buttonAction!: () => void

  onClick($event: Event) {
    if(this.disabled) {
      return;
    }
    $event.stopPropagation();
    this.action();
  }

  clickAccessoryButton($event: Event) {
    if(this.disabled) {
      return;
    }
    $event.stopPropagation();
    this.buttonAction();
  }
}

export class MenuRow extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.transclude = true;
    this.template = template;
    this.controller = MenuRowCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      action: '&',
      buttonAction: '&',
      buttonClass: '=',
      buttonText: '=',
      desc: '=',
      disabled: '=',
      circle: '=',
      circleAlign: '=',
      faded: '=',
      hasButton: '=',
      label: '=',
      spinnerClass: '=',
      stylekitClass: '=',
      subRows: '=',
      subtitle: '=',
    };
  }
}
