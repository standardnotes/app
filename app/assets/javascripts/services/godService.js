import angular from 'angular';

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
    if (this.application.noAccount()) {
      return false;
    }
    const updateAvailable = await this.application.protocolService.upgradeAvailable();
    if (updateAvailable !== this.securityUpdateAvailable) {
      this.securityUpdateAvailable = updateAvailable;
      this.$rootScope.$broadcast("security-update-status-changed");
    }
    return this.securityUpdateAvailable;
  }

  presentPasswordWizard(type) {
    var scope = this.$rootScope.$new(true);
    scope.type = type;
    var el = this.$compile("<password-wizard type='type'></password-wizard>")(scope);
    angular.element(document.body).append(el);
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
