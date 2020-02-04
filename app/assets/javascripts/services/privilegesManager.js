import angular from 'angular';
import { SFPrivilegesManager } from 'snjs';

export class PrivilegesManager extends SFPrivilegesManager {

  /* @ngInject */
  constructor(
    passcodeManager,
    authManager,
    syncManager,
    singletonManager,
    modelManager,
    storageManager,
    $rootScope,
    $compile
  ) {
    super(modelManager, syncManager, singletonManager);

    this.$rootScope = $rootScope;
    this.$compile = $compile;

    this.setDelegate({
      isOffline: async () => {
        return authManager.offline();
      },
      hasLocalPasscode: async () => {
        return passcodeManager.hasPasscode();
      },
      saveToStorage: async (key, value) => {
        return storageManager.setItem(key, value, storageManager.bestStorageMode());
      },
      getFromStorage: async (key) => {
        return storageManager.getItem(key, storageManager.bestStorageMode());
      },
      verifyAccountPassword: async (password) => {
        return authManager.verifyAccountPassword(password);
      },
      verifyLocalPasscode: async (passcode) => {
        return passcodeManager.verifyPasscode(passcode);
      },
    });
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
}
