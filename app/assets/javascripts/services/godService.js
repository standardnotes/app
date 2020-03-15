import angular from 'angular';
import { challengeToString } from 'snjs';
import { humanReadableList } from '@/utils';

export class GodService {
  /* @ngInject */
  constructor(
    $rootScope,
    $compile,
    application
  ) {
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.application = application;
  }

  async checkForSecurityUpdate() {
    return this.application.protocolUpgradeAvailable();
  }

  presentPasswordWizard(type) {
    const scope = this.$rootScope.$new(true);
    scope.type = type;
    const el = this.$compile("<password-wizard type='type'></password-wizard>")(scope);
    angular.element(document.body).append(el);
  }

  async promptForChallenges(challenges) {
    return new Promise((resolve) => {
      const scope = this.$rootScope.$new(true);
      scope.challenges = challenges.slice();
      scope.onSubmit = (responses) => {
        resolve(responses);
      };
      const el = this.$compile(
        "<challenge-modal class='sk-modal' challenges='challenges' on-submit='onSubmit'></challenge-modal>"
      )(scope);
      angular.element(document.body).append(el);
    });
  }

  async performProtocolUpgrade() {
    const errors = await this.application.upgradeProtocolVersion({
      requiresChallengeResponses: async (challenges) => {
        return this.promptForChallenges(challenges);
      },
      handleFailedChallengeResponses: async (responses) => {
        const names = responses.map((r) => challengeToString(r.challenge));
        const formatted = humanReadableList(names);
        return new Promise((resolve) => {
          this.application.alertService.alert({
            text: `Invalid authentication value for ${formatted}. Please try again.`,
            onClose: () => {
              resolve();
            }
          });
        });
      }
    });
    if (errors.length === 0) {
      this.application.alertService.alert({
        text: "Success! Your encryption version has been upgraded." +
              " You'll be asked to enter your credentials again on other devices you're signed into."
      });
    } else {
      this.application.alertService.alert({
        text: "Unable to upgrade encryption version. Please try again."
      });
    }
  }

  async presentPrivilegesModal(action, onSuccess, onCancel) {
    if (this.authenticationInProgress()) {
      onCancel && onCancel();
      return;
    }

    const customSuccess = async () => {
      onSuccess && await onSuccess();
      this.currentAuthenticationElement = null;
    };
    const customCancel = async () => {
      onCancel && await onCancel();
      this.currentAuthenticationElement = null;
    };

    const scope = this.$rootScope.$new(true);
    scope.action = action;
    scope.onSuccess = customSuccess;
    scope.onCancel = customCancel;
    const el = this.$compile(`
      <privileges-auth-modal action='action' on-success='onSuccess' 
      on-cancel='onCancel' class='sk-modal'></privileges-auth-modal>
    `)(scope);
    angular.element(document.body).append(el);

    this.currentAuthenticationElement = el;
  }

  presentPrivilegesManagementModal() {
    var scope = this.$rootScope.$new(true);
    var el = this.$compile("<privileges-management-modal class='sk-modal'></privileges-management-modal>")(scope);
    angular.element(document.body).append(el);
  }

  authenticationInProgress() {
    return this.currentAuthenticationElement != null;
  }

  presentPasswordModal(callback) {
    const scope = this.$rootScope.$new(true);
    scope.type = "password";
    scope.title = "Decryption Assistance";
    scope.message = `Unable to decrypt this item with your current keys. 
                     Please enter your account password at the time of this revision.`;
    scope.callback = callback;
    const el = this.$compile(
      `<input-modal type='type' message='message' 
     title='title' callback='callback'></input-modal>`
    )(scope);
    angular.element(document.body).append(el);
  }

  presentRevisionPreviewModal(uuid, content) {
    const scope = this.$rootScope.$new(true);
    scope.uuid = uuid;
    scope.content = content;
    const el = this.$compile(
      `<revision-preview-modal uuid='uuid' content='content' 
      class='sk-modal'></revision-preview-modal>`
    )(scope);
    angular.element(document.body).append(el);
  }
}
