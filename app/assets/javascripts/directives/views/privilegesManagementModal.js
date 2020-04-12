import template from '%/directives/privileges-management-modal.pug';
import { PrivilegeCredentials } from 'snjs';
import { PureCtrl } from '@Controllers/abstract/pure_ctrl';

class PrivilegesManagementModalCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    $element
  ) {
    super($timeout);
    this.$element = $element;
  }
  
  onAppLaunch() {
    super.onAppLaunch();
    this.hasPasscode = this.application.hasPasscode();
    this.hasAccount = !this.application.noAccount();
    this.reloadPrivileges();
  }

  displayInfoForCredential(credential) {
    const info = this.application.privilegesService.displayInfoForCredential(credential);
    if (credential === PrivilegeCredentials.LocalPasscode) {
      info.availability = this.hasPasscode;
    } else if (credential === PrivilegeCredentials.AccountPassword) {
      info.availability = this.hasAccount;
    } else {
      info.availability = true;
    }
    return info;
  }

  displayInfoForAction(action) {
    return this.application.privilegesService.displayInfoForAction(action).label;
  }

  isCredentialRequiredForAction(action, credential) {
    if (!this.privileges) {
      return false;
    }
    return this.privileges.isCredentialRequiredForAction(action, credential);
  }

  async clearSession() {
    await this.application.privilegesService.clearSession();
    this.reloadPrivileges();
  }

  async reloadPrivileges() {
    this.availableActions = this.application.privilegesService.getAvailableActions();
    this.availableCredentials = this.application.privilegesService.getAvailableCredentials();
    const sessionEndDate = await this.application.privilegesService.getSessionExpirey();
    this.sessionExpirey = sessionEndDate.toLocaleString();
    this.sessionExpired = new Date() >= sessionEndDate;
    this.credentialDisplayInfo = {};
    for (const cred of this.availableCredentials) {
      this.credentialDisplayInfo[cred] = this.displayInfoForCredential(cred);
    }
    const privs = await this.application.privilegesService.getPrivileges();
    this.$timeout(() => {
      this.privileges = privs;
    });
  }

  checkboxValueChanged(action, credential) {
    this.privileges.toggleCredentialForAction(action, credential);
    this.application.privilegesService.savePrivileges();
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

export class PrivilegesManagementModal {
  constructor() {
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
