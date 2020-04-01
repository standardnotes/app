import { protocolManager } from 'snjs';
import template from '%/directives/password-wizard.pug';
import { STRING_FAILED_PASSWORD_CHANGE } from '@/strings';

const DEFAULT_CONTINUE_TITLE = "Continue";
const Steps = {
  IntroStep:    0,
  BackupStep:   1,
  SignoutStep:  2,
  PasswordStep: 3,
  SyncStep:     4,
  FinishStep:   5
};

class PasswordWizardCtrl { 
  /* @ngInject */
  constructor(
    $element,
    $scope,
    $timeout,
    alertManager,
    archiveManager,
    authManager,
    modelManager,
    syncManager,
  ) {
    this.$element = $element;
    this.$timeout = $timeout;
    this.$scope = $scope;
    this.alertManager = alertManager;
    this.archiveManager = archiveManager;
    this.authManager = authManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    this.registerWindowUnloadStopper();
  }
  
  $onInit() {
    this.syncStatus = this.syncManager.syncStatus;
    this.formData = {};
    this.configureDefaults();
  }

  configureDefaults() {
    if (this.type === 'change-pw') {
      this.title = "Change Password";
      this.changePassword = true;
    } else if (this.type === 'upgrade-security') {
      this.title = "Security Update";
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
      case Steps.BackupStep:
        return "Download a backup of your data";
      case Steps.SignoutStep:
        return "Sign out of all your devices";
      case Steps.PasswordStep:
        return this.changePassword 
          ? "Password information" 
          : "Enter your current password";
      case Steps.SyncStep:
        return "Encrypt and sync data with new keys";
      case Steps.FinishStep:
        return "Sign back in to your devices";
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
      await preprocessor().then((success) => {
        if(success) {
          next();
        } else {
          this.$timeout(() => {
            this.isContinuing = false;
          });
        }
      }).catch(() => {
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
    if (step === Steps.SyncStep) {
      await this.initializeSyncingStep();
    } else if (step === Steps.FinishStep) {
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
    if(!passwordSuccess) {
      this.formData.status = "Unable to process your password. Please try again.";
      return;
    }
    this.formData.status = "Encrypting and syncing data with new keys...";
    
    const syncSuccess = await this.resyncData();
    this.formData.statusError = !syncSuccess;
    this.formData.processing = !syncSuccess;
    if (syncSuccess) {
      this.lockContinue = false;
      if (this.changePassword) {
        this.formData.status = "Successfully changed password and synced all items.";
      } else if (this.securityUpdate) {
        this.formData.status = "Successfully performed security update and synced all items.";
      }
    } else {
      this.formData.status = STRING_FAILED_PASSWORD_CHANGE;
    }
  }

  async validateCurrentPassword() {
    const currentPassword = this.formData.currentPassword;
    const newPass = this.securityUpdate ? currentPassword : this.formData.newPassword;
    if (!currentPassword || currentPassword.length === 0) {
      this.alertManager.alert({ 
        text: "Please enter your current password." 
      });
      return false;
    }
    if (this.changePassword) {
      if (!newPass || newPass.length === 0) {
        this.alertManager.alert({ 
          text: "Please enter a new password." 
        });
        return false;
      }
      if (newPass !== this.formData.newPasswordConfirmation) {
        this.alertManager.alert({ 
          text: "Your new password does not match its confirmation." 
        });
        this.formData.status = null;
        return false;
      }
    }
    if (!this.authManager.user.email) {
      this.alertManager.alert({ 
        text: "We don't have your email stored. Please log out then log back in to fix this issue." 
      });
      this.formData.status = null;
      return false;
    }

    const minLength = this.authManager.getMinPasswordLength();
    if (!this.securityUpdate && newPass.length < minLength) {
      const message = `Your password must be at least ${minLength} characters in length. For your security, please choose a longer password or, ideally, a passphrase, and try again.`;
      this.alertManager.alert({
        text: message
      });
      return false;
    }

    /** Validate current password */
    const authParams = await this.authManager.getAuthParams();
    const password = this.formData.currentPassword;
    const keys = await protocolManager.computeEncryptionKeysForUser(
      password, 
      authParams
    );
    const success = keys.mk === (await this.authManager.keys()).mk;
    if (success) {
      this.currentServerPw = keys.pw;
    } else {
      this.alertManager.alert({ 
        text: "The current password you entered is not correct. Please try again." 
      });
    }
    return success;
  }

  async resyncData() {
    await this.modelManager.setAllItemsDirty();
    const response = await this.syncManager.sync();
    if (!response || response.error) {
      this.alertManager.alert({ 
        text: STRING_FAILED_PASSWORD_CHANGE 
      });
      return false;
    } else {
      return true;
    }
  }

  async processPasswordChange() {
    const newUserPassword = this.securityUpdate 
      ? this.formData.currentPassword 
      : this.formData.newPassword;

    const currentServerPw = this.currentServerPw;
    const results = await protocolManager.generateInitialKeysAndAuthParamsForUser(
      this.authManager.user.email, 
      newUserPassword
    );
    const newKeys = results.keys;
    const newAuthParams = results.authParams;
    /** 
     * Perform a sync beforehand to pull in any last minutes changes before we change 
     * the encryption key (and thus cant decrypt new changes).
     */ 
    await this.syncManager.sync();
    const response = await this.authManager.changePassword(
      await this.syncManager.getServerURL(), 
      this.authManager.user.email, 
      currentServerPw, 
      newKeys, 
      newAuthParams
    );
    if (response.error) {
      this.alertManager.alert({ 
        text: response.error.message 
          ? response.error.message 
          : "There was an error changing your password. Please try again." 
        });
        return false;
    } else {
      return true;
    }
  }

  downloadBackup(encrypted) {
    this.archiveManager.downloadBackup(encrypted);
  }

  dismiss() {
    if (this.lockContinue) {
      this.alertManager.alert({
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
