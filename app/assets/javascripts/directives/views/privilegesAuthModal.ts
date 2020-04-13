import { WebDirective } from './../../types';
import { WebApplication } from '@/application';
import { ProtectedAction, PrivilegeCredential, PrivilegeSessionLength } from 'snjs';
import template from '%/directives/privileges-auth-modal.pug';

type PrivilegesAuthModalScope = {
  application: WebApplication
  action: ProtectedAction
  onSuccess: () => void
  onCancel: () => void
}

class PrivilegesAuthModalCtrl implements PrivilegesAuthModalScope {
  $element: JQLite
  $timeout: ng.ITimeoutService
  application!: WebApplication
  action!: ProtectedAction
  onSuccess!: () => void
  onCancel!: () => void
  authParameters: Partial<Record<PrivilegeCredential, string>> = {}
  sessionLengthOptions!: { value: PrivilegeSessionLength, label: string }[]
  selectedSessionLength!: PrivilegeSessionLength
  requiredCredentials!: PrivilegeCredential[]
  failedCredentials!: PrivilegeCredential[]

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService
  ) {
    this.$element = $element;
    this.$timeout = $timeout;
  }

  $onInit() {
    this.sessionLengthOptions = this.application!.privilegesService!
      .getSessionLengthOptions();
    this.application.privilegesService!.getSelectedSessionLength()
      .then((length) => {
        this.$timeout(() => {
          this.selectedSessionLength = length;
        });
      });
    this.application.privilegesService!.netCredentialsForAction(this.action)
      .then((credentials) => {
        this.$timeout(() => {
          this.requiredCredentials = credentials.sort();
        });
      });
  }

  selectSessionLength(length: PrivilegeSessionLength) {
    this.selectedSessionLength = length;
  }

  promptForCredential(credential: PrivilegeCredential) {
    return this.application.privilegesService!.displayInfoForCredential(credential).prompt;
  }

  cancel() {
    this.dismiss();
    this.onCancel && this.onCancel();
  }

  isCredentialInFailureState(credential: PrivilegeCredential) {
    if (!this.failedCredentials) {
      return false;
    }
    return this.failedCredentials.find((candidate) => {
      return candidate === credential;
    }) != null;
  }

  validate() {
    const failed = [];
    for (const cred of this.requiredCredentials) {
      const value = this.authParameters[cred];
      if (!value || value.length === 0) {
        failed.push(cred);
      }
    }
    this.failedCredentials = failed;
    return failed.length === 0;
  }

  async submit() {
    if (!this.validate()) {
      return;
    }
    const result = await this.application.privilegesService!.authenticateAction(
      this.action,
      this.authParameters
    );
    this.$timeout(() => {
      if (result.success) {
        this.application.privilegesService!.setSessionLength(this.selectedSessionLength);
        this.onSuccess();
        this.dismiss();
      } else {
        this.failedCredentials = result.failedCredentials;
      }
    });
  }

  dismiss() {
    const elem = this.$element;
    const scope = elem.scope();
    scope.$destroy();
    elem.remove();
  }
}

export class PrivilegesAuthModal extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = PrivilegesAuthModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      action: '=',
      onSuccess: '=',
      onCancel: '=',
      application: '='
    };
  }
}
