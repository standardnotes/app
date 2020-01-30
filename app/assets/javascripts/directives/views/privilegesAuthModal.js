import template from '%/directives/privileges-auth-modal.pug';

class PrivilegesAuthModalCtrl {
  /* @ngInject */
  constructor(
    $element,
    $timeout,
    privilegesManager,
  ) {
    this.$element = $element;
    this.$timeout = $timeout;
    this.privilegesManager = privilegesManager;
  }

  $onInit() {
    this.authParameters = {};
    this.sessionLengthOptions = this.privilegesManager.getSessionLengthOptions();
    this.privilegesManager.getSelectedSessionLength().then((length) => {
      this.$timeout(() => {
        this.selectedSessionLength = length;
      })
    })
    this.privilegesManager.netCredentialsForAction(this.action).then((credentials) => {
      this.$timeout(() => {
        this.requiredCredentials = credentials.sort();
      });
    });
  }

  selectSessionLength(length) {
    this.selectedSessionLength = length;
  }

  promptForCredential(credential) {
    return this.privilegesManager.displayInfoForCredential(credential).prompt;
  }

  cancel() {
    this.dismiss();
    this.onCancel && this.onCancel();
  }

  isCredentialInFailureState(credential) {
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
    const result = await this.privilegesManager.authenticateAction(
      this.action, 
      this.authParameters
    );
    this.$timeout(() => {
      if (result.success) {
        this.privilegesManager.setSessionLength(this.selectedSessionLength);
        this.onSuccess();
        this.dismiss();
      } else {
        this.failedCredentials = result.failedCredentials;
      }
    })
  }

  dismiss() {
    this.$element.remove();
  }
}

export class PrivilegesAuthModal {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = PrivilegesAuthModalCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      action: '=',
      onSuccess: '=',
      onCancel: '='
    };
  }
}
