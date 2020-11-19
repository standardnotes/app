import { ApplicationGroup } from '@/ui_models/application_group';
import { WebApplication } from '@/ui_models/application';
import template from './account-switcher.pug';
import {
  ApplicationDescriptor,
} from '@standardnotes/snjs';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { WebDirective } from '@/types';

class AccountSwitcherCtrl extends PureViewCtrl<{}, {
  descriptors: ApplicationDescriptor[];
  editingDescriptor?: ApplicationDescriptor
}> {
  private $element: JQLite
  application!: WebApplication
  private removeAppGroupObserver: any;
  /** @template */
  activeApplication!: WebApplication

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService,
    private mainApplicationGroup: ApplicationGroup
  ) {
    super($timeout);
    this.$element = $element;
    this.removeAppGroupObserver = mainApplicationGroup.addApplicationChangeObserver(() => {
      this.activeApplication = mainApplicationGroup.primaryApplication as WebApplication;
      this.reloadApplications();
    });
  }

  $onInit() {
    super.$onInit();
  }

  reloadApplications() {
    this.setState({
      descriptors: this.mainApplicationGroup.getDescriptors()
    })
  }

  /** @template */
  addNewApplication() {
    this.dismiss();
    this.mainApplicationGroup.addNewApplication();
  }

  /** @template */
  selectDescriptor(descriptor: ApplicationDescriptor) {
    this.dismiss();
    this.mainApplicationGroup.loadApplicationForDescriptor(descriptor);
  }

  inputForDescriptor(descriptor: ApplicationDescriptor) {
    return document.getElementById(`input-${descriptor.identifier}`);
  }

  /** @template */
  renameDescriptor($event: Event, descriptor: ApplicationDescriptor) {
    $event.stopPropagation();
    this.setState({ editingDescriptor: descriptor }).then(() => {
      const input = this.inputForDescriptor(descriptor);
      input?.focus();
    })
  }

  /** @template */
  submitRename() {
    this.mainApplicationGroup.renameDescriptor(
      this.state.editingDescriptor!,
      this.state.editingDescriptor!.label
    )
    this.setState({ editingDescriptor: undefined });
  }

  deinit() {
    (this.application as any) = undefined;
    super.deinit();
    this.removeAppGroupObserver();
    this.removeAppGroupObserver = undefined;
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class AccountSwitcher extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = AccountSwitcherCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
