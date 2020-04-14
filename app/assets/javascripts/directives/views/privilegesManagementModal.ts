import { WebDirective } from './../../types';
import { WebApplication } from '@/ui_models/application';
import template from '%/directives/privileges-management-modal.pug';
import { PrivilegeCredential, ProtectedAction, SNPrivileges, PrivilegeSessionLength } from 'snjs';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';
import { PrivilegeMutator } from '@/../../../../snjs/dist/@types/models';

type DisplayInfo = {
  label: string
  prompt: string
}

class PrivilegesManagementModalCtrl extends PureViewCtrl {

  hasPasscode = false
  hasAccount = false
  $element: JQLite
  application!: WebApplication
  privileges!: SNPrivileges
  availableActions!: ProtectedAction[]
  availableCredentials!: PrivilegeCredential[]
  sessionExpirey!: string
  sessionExpired = true
  credentialDisplayInfo: Partial<Record<PrivilegeCredential, DisplayInfo>> = {}
  onCancel!: () => void

  /* @ngInject */
  constructor(
    $timeout: ng.ITimeoutService,
    $element: JQLite
  ) {
    super($timeout);
    this.$element = $element;
  }
  
  async onAppLaunch() {
    super.onAppLaunch();
    this.hasPasscode = this.application.hasPasscode();
    this.hasAccount = !this.application.noAccount();
    this.reloadPrivileges();
  }

  displayInfoForCredential(credential: PrivilegeCredential) {
    const info: any = this.application.privilegesService!.displayInfoForCredential(credential);
    if (credential === PrivilegeCredential.LocalPasscode) {
      info.availability = this.hasPasscode;
    } else if (credential === PrivilegeCredential.AccountPassword) {
      info.availability = this.hasAccount;
    } else {
      info.availability = true;
    }
    return info;
  }

  displayInfoForAction(action: ProtectedAction) {
    return this.application.privilegesService!.displayInfoForAction(action).label;
  }

  isCredentialRequiredForAction(action: ProtectedAction, credential: PrivilegeCredential) {
    if (!this.privileges) {
      return false;
    }
    return this.privileges.isCredentialRequiredForAction(action, credential);
  }

  async clearSession() {
    await this.application.privilegesService!.clearSession();
    this.reloadPrivileges();
  }

  async reloadPrivileges() {
    this.availableActions = this.application.privilegesService!.getAvailableActions();
    this.availableCredentials = this.application.privilegesService!.getAvailableCredentials();
    const sessionEndDate = await this.application.privilegesService!.getSessionExpirey();
    this.sessionExpirey = sessionEndDate.toLocaleString();
    this.sessionExpired = new Date() >= sessionEndDate;
    for (const cred of this.availableCredentials) {
      this.credentialDisplayInfo[cred] = this.displayInfoForCredential(cred);
    }
    const privs = await this.application.privilegesService!.getPrivileges();
    this.$timeout(() => {
      this.privileges = privs;
    });
  }

  checkboxValueChanged(action: ProtectedAction, credential: PrivilegeCredential) {
    this.application.changeAndSaveItem(this.privileges.uuid, (m) => {
      const mutator = m as PrivilegeMutator;
      mutator.toggleCredentialForAction(action, credential);
    })
  }

  cancel() {
    this.dismiss();
    this.onCancel && this.onCancel();
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class PrivilegesManagementModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = PrivilegesManagementModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      application: '='
    };
  }
}
