import { PrivilegesManager } from '@/services/privilegesManager';
import template from '%/directives/privileges-management-modal.pug';

class PrivilegesManagementModalCtrl {
  /* @ngInject */
  constructor(
    $timeout,
    $element,
    application
  ) {
    this.$element = $element;
    this.$timeout = $timeout;
    this.application = application;
    this.hasPasscode = application.hasPasscode();
    this.hasAccount = !application.noUser();
    this.reloadPrivileges();
  }

  displayInfoForCredential(credential) {
    const info = this.application.privilegesManager.displayInfoForCredential(credential);
    if (credential === PrivilegesManager.CredentialLocalPasscode) {
      info.availability = this.hasPasscode;
    } else if (credential === PrivilegesManager.CredentialAccountPassword) {
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
