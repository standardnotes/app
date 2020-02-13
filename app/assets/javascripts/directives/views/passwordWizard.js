import template from '%/directives/password-wizard.pug';
import { PureCtrl } from '@Controllers';

const DEFAULT_CONTINUE_TITLE = "Continue";
const Steps = {
  PasswordStep: 3,
  FinishStep: 5
};

class PasswordWizardCtrl extends PureCtrl {
  /* @ngInject */
  constructor(
    $element,
    $scope,
    $timeout,
    application,
    appState
  ) {
    super($scope, $timeout, application, appState);
    this.$element = $element;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.registerWindowUnloadStopper();
  }

  $onInit() {
    this.initProps({
      type: this.type,
      changePassword: this.props.type === 'change-pw',
      securityUpdate: this.props.type === 'upgrade-security'
    });
    this.setState({
      formData: {},
      continueTitle: DEFAULT_CONTINUE_TITLE,
      step: Steps.PasswordStep,
      title: this.props.changePassword ? 'Change Password' : 'Account Update'
    });
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
        return this.props.changePassword
          ? "Password information"
          : "Enter your current password";
      case Steps.FinishStep:
        return "Success";
      default:
        return null;
    }
  }

  async nextStep() {
    if (this.state.lockContinue || this.isContinuing) {
      return;
    }
    this.isContinuing = true;
    if (this.step === Steps.FinishStep) {
      this.dismiss();
      return;
    }
    if(this.step === Steps.PasswordStep) {
      this.setState({
        showSpinner: true,
        continueTitle: "Generating Keys..."
      });
      const success = await this.validateCurrentPassword();
      this.setState({
        showSpinner: false,
        continueTitle: DEFAULT_CONTINUE_TITLE
      });
      if(!success) {
        return;
      }
      this.isContinuing = false;
    }
    this.step++;
    this.initializeStep(this.step);
    this.isContinuing = false;
  }

  async initializeStep(step) {
    if (step === Steps.FinishStep) {
      this.continueTitle = "Finish";
    }
  }

  async setFormDataState(formData) {
    return this.setState({
      formData: {
        ...this.state.formData,
        ...formData
      }
    });
  }

  async initializeSyncingStep() {
    this.setState({
      lockContinue: true,
      processing: true
    });
    this.setFormDataState({
      status: "Processing encryption keys..."
    });
    const passwordSuccess = await this.processPasswordChange();
    this.setFormDataState({
      statusError: !passwordSuccess,
      processing: passwordSuccess
    });
    if (!passwordSuccess) {
      this.setFormDataState({
        status: "Unable to process your password. Please try again."
      });
      return;
    }
    this.setState({
      lockContinue: false,
      formData: {
        ...this.state.formData,
        status: this.props.changePassword 
          ? "Successfully changed password." 
          : "Successfully performed account update."
      }
    });
  }

  async validateCurrentPassword() {
    const currentPassword = this.state.formData.currentPassword;
    const newPass = this.props.securityUpdate ? currentPassword : this.state.formData.newPassword;
    if (!currentPassword || currentPassword.length === 0) {
      this.application.alertManager.alert({
        text: "Please enter your current password."
      });
      return false;
    }
    if (this.props.changePassword) {
      if (!newPass || newPass.length === 0) {
        this.application.alertManager.alert({
          text: "Please enter a new password."
        });
        return false;
      }
      if (newPass !== this.state.formData.newPasswordConfirmation) {
        this.application.alertManager.alert({
          text: "Your new password does not match its confirmation."
        });
        this.state.formData.status = null;
        return false;
      }
    }
    if (!this.application.getUser().email) {
      this.application.alertManager.alert({
        text: "We don't have your email stored. Please log out then log back in to fix this issue."
      });
      this.state.formData.status = null;
      return false;
    }

    /** Validate current password */
    const success = await this.application.validateAccountPassword({
      password: this.state.formData.currentPassword
    });
    if (!success) {
      this.application.alertManager.alert({
        text: "The current password you entered is not correct. Please try again."
      });
    }
    return success;
  }

  async processPasswordChange() {
    const newPassword = this.props.securityUpdate
      ? this.state.formData.currentPassword
      : this.state.formData.newPassword;

    const response = await this.application.changePassword({
      email: this.application.getUser().email,
      currentPassword: this.state.formData.currentPassword,
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
    if (this.state.lockContinue) {
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
