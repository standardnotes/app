import template from '%/lock-screen.pug';
import { AppStateEvents } from '@/state';
import { PureCtrl } from './abstract/pure_ctrl';

const ELEMENT_ID_PASSCODE_INPUT = 'passcode-input';

class LockScreenCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $scope,
    $timeout,
    application,
    appState
  ) {
    super($scope, $timeout, application, appState);
    this.formData = {};
  }

  $onInit() {
    this.puppet.focusInput = () => {
      this.passcodeInput.focus();
    };
  }

  get passcodeInput() {
    return document.getElementById(
      ELEMENT_ID_PASSCODE_INPUT
    );
  }

  /** @override */
  async onAppStateEvent(eventName, data) {
    if (eventName === AppStateEvents.WindowDidFocus) {
      const input = this.passcodeInput;
      if (input) {
        input.focus();
      }
    }
  }

  async submitPasscodeForm($event) {
    if (
      !this.formData.passcode ||
      this.formData.passcode.length === 0
    ) {
      return;
    }
    this.passcodeInput.blur();
    this.onValue()(this.formData.passcode);
  }

  forgotPasscode() {
    this.formData.showRecovery = true;
  }

  beginDeleteData() {
    this.application.alertManager.confirm({
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
      puppet: '='
    };
  }
}
