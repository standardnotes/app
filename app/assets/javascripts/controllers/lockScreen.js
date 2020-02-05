import template from '%/lock-screen.pug';
import {
  APP_STATE_EVENT_WINDOW_DID_FOCUS
} from '@/state';

const ELEMENT_ID_PASSCODE_INPUT = 'passcode-input';

class LockScreenCtrl {

  /* @ngInject */
  constructor(
    $scope,
    alertManager,
    application,
    appState
  ) {
    this.$scope = $scope;
    this.alertManager = alertManager;
    this.application = application;
    this.appState = appState;
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
      this.unregisterObserver();
    });
  }

  addVisibilityObserver() {
    this.unregisterObserver = this.appState.addObserver((eventName, data) => {
      if (eventName === APP_STATE_EVENT_WINDOW_DID_FOCUS) {
        const input = this.passcodeInput;
        if(input) {
          input.focus();
        }
      }
    });
  }

  async submitPasscodeForm($event) {
    if(
      !this.formData.passcode ||
      this.formData.passcode.length === 0
    ) {
      return;
    }
    this.passcodeInput.blur();
    const success = await this.onValue()(this.formData.passcode);
    if(!success) {
      this.alertManager.alert({
        text: "Invalid passcode. Please try again.",
        onClose: () => {
          this.passcodeInput.focus();
        }
      });
    }
  }

  forgotPasscode() {
    this.formData.showRecovery = true;
  }

  beginDeleteData() {
    this.alertManager.confirm({
      text: "Are you sure you want to clear all local data?",
      destructive: true,
      onConfirm: async () => {
        await this.application.signOut();
        await this.application.restart();
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
      onValue: '&',
    };
  }
}
