import template from '%/directives/privileges-management-modal.pug';
import { PrivilegeCredentials } from 'snjs';
import { PureCtrl } from '@Controllers';

class PrivilegesManagementModalCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    $element,
    application
  ) {
    super(null, $timeout);
    this.$element = $element;
    this.application = application;
  }
  
  onAppUnlock() {
    super.onAppUnlock();
    this.hasPasscode = this.application.hasPasscode();
    this.hasAccount = !this.application.noAccount();
    this.reloadPrivileges();
  }

  displayInfoForCredential(credential) {
    const info = this.application.privilegesManager.displayInfoForCredential(credential);
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
    return this.application.privilegesManager.displayInfoForAction(action).label;
  }

  isCredentialRequiredForAction(action, credential) {
    if (!this.privileges) {
      return false;
    }
    return this.privileges.isCredentialRequiredForAction(action, credential);
  }

  async clearSession() {
    await this.application.privilegesManager.clearSession();
    this.reloadPrivileges();
  }

  async reloadPrivileges() {
    this.availableActions = this.application.privilegesManager.getAvailableActions();
    this.availableCredentials = this.application.privilegesManager.getAvailableCredentials();
    const sessionEndDate = await this.application.privilegesManager.getSessionExpirey();
    this.sessionExpirey = sessionEndDate.toLocaleString();
    this.sessionExpired = new Date() >= sessionEndDate;
    this.credentialDisplayInfo = {};
    for (const cred of this.availableCredentials) {
      this.credentialDisplayInfo[cred] = this.displayInfoForCredential(cred);
    }
    const privs = await this.application.privilegesManager.getPrivileges();
    this.$timeout(() => {
      this.privileges = privs;
    });
  }

  checkboxValueChanged(action, credential) {
    this.privileges.toggleCredentialForAction(action, credential);
    this.application.privilegesManager.savePrivileges();
  }

  cancel() {
    this.dismiss();
    this.onCancel && this.onCancel();
  }

  dismiss() {
    this.$element.remove();
  }
}

export class PrivilegesManagementModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = PrivilegesManagementModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {};
  }
}
