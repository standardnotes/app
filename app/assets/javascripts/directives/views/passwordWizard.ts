import { WebApplication } from '@/ui_models/application';
import { PasswordWizardScope, PasswordWizardType, WebDirective } from './../../types';
import template from '%/directives/password-wizard.pug';
import { PureViewCtrl } from '@Views/abstract/pure_view_ctrl';

const DEFAULT_CONTINUE_TITLE = "Continue";
enum Steps {
  PasswordStep = 1,
  FinishStep = 2
};

type FormData = {
  currentPassword?: string,
  newPassword?: string,
  newPasswordConfirmation?: string,
  status?: string
}

type State = {
  lockContinue: boolean
  formData: FormData,
  continueTitle: string,
  step: Steps,
  title: string,
  showSpinner: boolean
  processing: boolean
}

type Props = {
  type: PasswordWizardType,
  changePassword: boolean,
  securityUpdate: boolean
}

class PasswordWizardCtrl extends PureViewCtrl<Props, State> implements PasswordWizardScope {
  $element: JQLite
  application!: WebApplication
  type!: PasswordWizardType
  isContinuing = false

  /* @ngInject */
  constructor(
    $element: JQLite,
    $timeout: ng.ITimeoutService,
  ) {
    super($timeout);
    this.$element = $element;
    this.registerWindowUnloadStopper();
  }

  $onInit() {
    super.$onInit();
    this.initProps({
      type: this.type,
      changePassword: this.type === PasswordWizardType.ChangePassword,
      securityUpdate: this.type === PasswordWizardType.AccountUpgrade
    });
    this.setState({
      formData: {},
      continueTitle: DEFAULT_CONTINUE_TITLE,
      step: Steps.PasswordStep,
      title: this.props.changePassword ? 'Change Password' : 'Account Update'
    });
  }

  $onDestroy() {
    super.$onDestroy();
    window.onbeforeunload = null;
  }

  /** Confirms with user before closing tab */
  registerWindowUnloadStopper() {
    window.onbeforeunload = () => {
      return true;
    };
  }

  resetContinueState() {
    this.setState({
      showSpinner: false,
      continueTitle: DEFAULT_CONTINUE_TITLE
    });
    this.isContinuing = false;
  }

  async nextStep() {
    if (this.state.lockContinue || this.isContinuing) {
      return;
    }
    if (this.state.step === Steps.FinishStep) {
      this.dismiss();
      return;
    }

    this.isContinuing = true;
    await this.setState({
      showSpinner: true,
      continueTitle: "Generating Keys..."
    });
    const valid = await this.validateCurrentPassword();
    if (!valid) {
      this.resetContinueState();
      return;
    }
    const success = await this.processPasswordChange();
    if (!success) {
      this.resetContinueState();
      return;
    }
    this.isContinuing = false;
    this.setState({
      showSpinner: false,
      continueTitle: "Finish",
      step: Steps.FinishStep
    });
  }

  async setFormDataState(formData: Partial<FormData>) {
    return this.setState({
      formData: {
        ...this.state.formData,
        ...formData
      }
    });
  }

  async validateCurrentPassword() {
    const currentPassword = this.state.formData.currentPassword;
    const newPass = this.props.securityUpdate ? currentPassword : this.state.formData.newPassword;
    if (!currentPassword || currentPassword.length === 0) {
      this.application.alertService!.alert(
        "Please enter your current password."
      );
      return false;
    }
    if (this.props.changePassword) {
      if (!newPass || newPass.length === 0) {
        this.application.alertService!.alert(
          "Please enter a new password."
        );
        return false;
      }
      if (newPass !== this.state.formData.newPasswordConfirmation) {
        this.application.alertService!.alert(
          "Your new password does not match its confirmation."
        );
        this.setFormDataState({
          status: undefined
        });
        return false;
      }
    }
    if (!this.application.getUser()?.email) {
      this.application.alertService!.alert(
        "We don't have your email stored. Please log out then log back in to fix this issue."
      );
      this.setFormDataState({
        status: undefined
      });
      return false;
    }

    /** Validate current password */
    const success = await this.application.validateAccountPassword(
      this.state.formData.currentPassword!
    );
    if (!success) {
      this.application.alertService!.alert(
        "The current password you entered is not correct. Please try again."
      );
    }
    return success;
  }

  async processPasswordChange() {
    await this.setState({
      lockContinue: true,
      processing: true
    });
    await this.setFormDataState({
      status: "Processing encryption keys..."
    });
    const newPassword = this.props.securityUpdate
      ? this.state.formData.currentPassword
      : this.state.formData.newPassword;
    const response = await this.application.changePassword(
      this.state.formData.currentPassword!,
      newPassword!
    );
    const success = !response.error;
    await this.setState({
      processing: false,
      lockContinue: false,
    });
    if (!success) {
      this.setFormDataState({
        status: "Unable to process your password. Please try again."
      });
    } else {
      this.setState({
        formData: {
          ...this.state.formData,
          status: this.props.changePassword
            ? "Successfully changed password."
            : "Successfully performed account update."
        }
      });
    }
    return success;
  }

  dismiss() {
    if (this.state.lockContinue) {
      this.application.alertService!.alert(
        "Cannot close window until pending tasks are complete."
      );
    } else {
      const elem = this.$element;
      const scope = elem.scope();
      scope.$destroy();
      elem.remove();
    }
  }
}

export class PasswordWizard extends WebDirective {
  constructor() {
    super();
    this.restrict = 'E';
    this.template = template;
    this.controller = PasswordWizardCtrl;
    this.controllerAs = 'ctrl';
    this.bindToController = true;
    this.scope = {
      type: '=',
      application: '='
    };
  }
}
