import template from '%/lock-screen.pug';

const ELEMENT_ID_PASSCODE_INPUT = 'passcode-input';

class LockScreenCtrl {

  /* @ngInject */
  constructor(
    $scope,
    alertManager,
    authManager,
    passcodeManager,
  ) {
    this.$scope = $scope;
    this.alertManager = alertManager;
    this.authManager = authManager;
    this.passcodeManager = passcodeManager;
    this.formData = {};

    this.addVisibilityObserver();
    this.addDestroyHandler();
  }

  get passcodeInput() {
    return document.getElementById(
      ELEMENT_ID_PASSCODE_INPUT
    );
  }

  addDestroyHandler() {
    this.$scope.$on('$destroy', () => {
      this.passcodeManager.removeVisibilityObserver(
        this.visibilityObserver
      );
    });
  }

  addVisibilityObserver() {
    this.visibilityObserver = this.passcodeManager
    .addVisibilityObserver((visible) => {
      if(visible) {
        const input = this.passcodeInput;
        if(input) {
          input.focus();
        }
      }
    });
  }

  submitPasscodeForm($event) {
    if(
      !this.formData.passcode ||
      this.formData.passcode.length === 0
    ) {
      return;
    }
    this.passcodeInput.blur();
    this.passcodeManager.unlock(
      this.formData.passcode,
      (success) => {
        if(!success) {
          this.formData.passcode = null;
          this.alertManager.alert({
            text: "Invalid passcode. Please try again.",
            onClose: () => {
              this.passcodeInput.focus();
            }
          });
        } else {
          this.onSuccess()();
        }
      }
    );
  }

  forgotPasscode() {
    this.formData.showRecovery = true;
  }

  beginDeleteData() {
    this.alertManager.confirm({
      text: "Are you sure you want to clear all local data?",
      destructive: true,
      onConfirm: () => {
        this.authManager.signout(true).then(() => {
          window.location.reload();
        });
      }
    });
  }
}

export class LockScreen {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = LockScreenCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      onSuccess: '&',
    };
  }
}
