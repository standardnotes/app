import template from '%/directives/password-wizard.pug';
import { STRING_FAILED_PASSWORD_CHANGE } from '@/strings';
import { isNullOrUndefined } from '../../utils';

const DEFAULT_CONTINUE_TITLE = "Continue";
const Steps = {
  PasswordStep: 3,
  FinishStep: 5
};

class PasswordWizardCtrl {
  /* @ngInject */
  constructor(
    $element,
    $scope,
    $timeout
  ) {
    this.$element = $element;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.registerWindowUnloadStopper();
  }

  $onInit() {
    this.formData = {};
    this.configureDefaults();
  }

  configureDefaults() {
    if (this.type === 'change-pw') {
      this.title = "Change Password";
      this.changePassword = true;
    } else if (this.type === 'upgrade-security') {
      this.title = "Account Update";
      this.securityUpdate = true;
    }
    this.continueTitle = DEFAULT_CONTINUE_TITLE;
    this.step = Steps.IntroStep;
  }

  /** Confirms with user before closing tab */
  registerWindowUnloadStopper() {
    window.onbeforeunload = (e) => {
      return true;
    };
    this.$scope.$on("$destroy", () => {
      window.onbeforeunload = null;
    });
  }

  titleForStep(step) {
    switch (step) {
      case Steps.PasswordStep:
        return this.changePassword
          ? "Password information"
          : "Enter your current password";
      case Steps.FinishStep:
        return "Success";
      default:
        return null;
    }
  }

  async nextStep() {
    if (this.lockContinue || this.isContinuing) {
      return;
    }
    this.isContinuing = true;
    if (this.step === Steps.FinishStep) {
      this.dismiss();
      return;
    }
    const next = () => {
      this.step++;
      this.initializeStep(this.step);
      this.isContinuing = false;
    };
    const preprocessor = this.preprocessorForStep(this.step);
    if (preprocessor) {
      await preprocessor().then(next).catch(() => {
        this.isContinuing = false;
      });
    } else {
      next();
    }
  }

  preprocessorForStep(step) {
    if (step === Steps.PasswordStep) {
      return async () => {
        this.showSpinner = true;
        this.continueTitle = "Generating Keys...";
        const success = await this.validateCurrentPassword();
        this.showSpinner = false;
        this.continueTitle = DEFAULT_CONTINUE_TITLE;
        return success;
      };
    }
  }

  async initializeStep(step) {
    if (step === Steps.FinishStep) {
      this.continueTitle = "Finish";
    }
  }

  async initializeSyncingStep() {
    this.lockContinue = true;
    this.formData.status = "Processing encryption keys...";
    this.formData.processing = true;
    const passwordSuccess = await this.processPasswordChange();
    this.formData.statusError = !passwordSuccess;
    this.formData.processing = passwordSuccess;
    if (!passwordSuccess) {
      this.formData.status = "Unable to process your password. Please try again.";
      return;
    }
    this.lockContinue = false;
    if (this.changePassword) {
      this.formData.status = "Successfully changed password.";
    } else if (this.securityUpdate) {
      this.formData.status = "Successfully performed account update.";
    }
  }

  async validateCurrentPassword() {
    const currentPassword = this.formData.currentPassword;
    const newPass = this.securityUpdate ? currentPassword : this.formData.newPassword;
    if (!currentPassword || currentPassword.length === 0) {
      this.application.alertManager.alert({
        text: "Please enter your current password."
      });
      return false;
    }
    if (this.changePassword) {
      if (!newPass || newPass.length === 0) {
        this.application.alertManager.alert({
          text: "Please enter a new password."
        });
        return false;
      }
      if (newPass !== this.formData.newPasswordConfirmation) {
        this.application.alertManager.alert({
          text: "Your new password does not match its confirmation."
        });
        this.formData.status = null;
        return false;
      }
    }
    if (!this.application.getUser().email) {
      this.application.alertManager.alert({
        text: "We don't have your email stored. Please log out then log back in to fix this issue."
      });
      this.formData.status = null;
      return false;
    }

    /** Validate current password */
    const key = await this.application.validateAccountPassword({
      password: this.formData.currentPassword
    });
    if (key) {
      this.currentServerPassword = key.serverPassword;
    } else {
      this.application.alertManager.alert({
        text: "The current password you entered is not correct. Please try again."
      });
    }
    return !isNullOrUndefined(key);
  }

  async processPasswordChange() {
    const newPassword = this.securityUpdate
      ? this.formData.currentPassword
      : this.formData.newPassword;

    const response = await this.application.changePassword({
      email: this.application.getUser().email,
      currentPassword: this.formData.currentPassword,
      newPassword: newPassword
    });
    if (response.error) {
      this.application.alertManager.alert({
        text: response.error.message
          ? response.error.message
          : "There was an error changing your password. Please try again."
      });
      return false;
    } else {
      return true;
    }
  }

  dismiss() {
    if (this.lockContinue) {
      this.application.alertManager.alert({
        text: "Cannot close window until pending tasks are complete."
      });
    } else {
      this.$element.remove();
      this.$scope.$destroy();
    }
  }
}

export class PasswordWizard {
  constructor() {
    this.restrict = 'E';
    this.template = template;
    this.controller = PasswordWizardCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      type: '='
    };
  }
}
