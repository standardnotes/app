import { WebApplication } from '@/ui_models/application';
import { SNComponent, LiveItem } from '@standardnotes/snjs';
import { WebDirective } from './../../types';
import template from '%/directives/component-modal.pug';

export type ComponentModalScope = {
  componentUuid: string
  onDismiss: () => void
  application: WebApplication
}

export class ComponentModalCtrl implements ComponentModalScope {
  $element: JQLite
  componentUuid!: string
  onDismiss!: () => void
  application!: WebApplication
  liveComponent!: LiveItem<SNComponent>
  component!: SNComponent

  /* @ngInject */
  constructor($element: JQLite) {
    this.$element = $element;
  }

  $onInit() {
    this.liveComponent = new LiveItem(
      this.componentUuid,
      this.application,
      (component) => {
        this.component = component;
      }
    );
    this.application.componentGroup.activateComponent(this.component);
  }

  $onDestroy() {
    this.application.componentGroup.deactivateComponent(this.component);
    this.liveComponent.deinit();
  }

  dismiss() {
    this.onDismiss && this.onDismiss();
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
      componentUuid: '=',
      onDismiss: '&',
      application: '='
    };
  }
}
