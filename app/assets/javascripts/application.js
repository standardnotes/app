import {
  SNApplication,
  SNAlertService,
  Environments,
  platformFromString
} from 'snjs';
import angular from 'angular';
import { getPlatformString } from '@/utils';
import { AlertService } from '@/services/alertService';
import { WebDeviceInterface } from '@/web_device_interface';

export class WebApplication extends SNApplication {
  /* @ngInject */
  constructor($compile, $timeout, scope, onDeinit) {
    const deviceInterface = new WebDeviceInterface({ timeout: $timeout });
    super({
      environment: Environments.Web,
      platform: platformFromString(getPlatformString()),
      namespace: '',
      host: window._default_sync_server,
      deviceInterface: deviceInterface,
      swapClasses: [
        {
          swap: SNAlertService,
          with: AlertService
        }
      ]
    });
    this.$compile = $compile;
    this.scope = scope;
    this.onDeinit = onDeinit;
    deviceInterface.setApplication(this);
  }

  /** @override */
  deinit() {
    for (const key of Object.keys(this.webServices)) {
      const service = this.webServices[key];
      if(service.deinit) {
        service.deinit();
      }
      service.application = null;
      delete this.webServices[key];
    }
    this.webServices = {};
    this.onDeinit(this);
    this.onDeinit = null;
    this.$compile = null;
    this.$timeout = null;
    this.scope.application = null;
    this.scope.$destroy();
    this.scope = null;
    super.deinit();
  }


  /** 
   * @access public 
   * @param {object} services
   */
  setWebServices(services) {
    this.webServices = services;
  }

  /** @access public */
  getAppState() {
    return this.webServices.appState;
  }

  /** @access public */
  getDesktopService() {
    return this.webServices.desktopService;
  }

  /** @access public */
  getLockService() {
    return this.webServices.lockService;
  }

  /** @access public */
  getArchiveService() {
    return this.webServices.archiveService;
  }

  /** @access public */
  getNativeExtService() {
    return this.webServices.nativeExtService;
  }

  /** @access public */
  getStatusService() {
    return this.webServices.statusService;
  }

  /** @access public */
  getThemeService() {
    return this.webServices.themeService;
  }

  /** @access public */
  getPrefsService() {
    return this.webServices.prefsService;
  }

  /** @access public */
  getKeyboardService() {
    return this.webServices.keyboardService;
  }

  async checkForSecurityUpdate() {
    return this.protocolUpgradeAvailable();
  }

  presentPasswordWizard(type) {
    const scope = this.scope.$new(true);
    scope.type = type;
    scope.application = this;
    const el = this.$compile("<password-wizard application='application' type='type'></password-wizard>")(scope);
    angular.element(document.body).append(el);
  }

  promptForChallenge(challenge, orchestrator) {
    const scope = this.scope.$new(true);
    scope.challenge = challenge;
    scope.orchestrator = orchestrator;
    scope.application = this;
    const el = this.$compile(
      "<challenge-modal " +
      "class='sk-modal' application='application' challenge='challenge' orchestrator='orchestrator'>" +
      "</challenge-modal>"
    )(scope);
    angular.element(document.body).append(el);
  }

  async performProtocolUpgrade() {
    const errors = await this.upgradeProtocolVersion();
    if (errors.length === 0) {
      this.alertService.alert({
        text: "Success! Your encryption version has been upgraded." +
          " You'll be asked to enter your credentials again on other devices you're signed into."
      });
    } else {
      this.alertService.alert({
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

    const scope = this.scope.$new(true);
    scope.action = action;
    scope.onSuccess = customSuccess;
    scope.onCancel = customCancel;
    scope.application = this;
    const el = this.$compile(`
      <privileges-auth-modal application='application' action='action' on-success='onSuccess' 
      on-cancel='onCancel' class='sk-modal'></privileges-auth-modal>
    `)(scope);
    angular.element(document.body).append(el);

    this.currentAuthenticationElement = el;
  }

  presentPrivilegesManagementModal() {
    const scope = this.scope.$new(true);
    scope.application = this;
    const el = this.$compile("<privileges-management-modal application='application' class='sk-modal'></privileges-management-modal>")(scope);
    angular.element(document.body).append(el);
  }

  authenticationInProgress() {
    return this.currentAuthenticationElement != null;
  }

  presentPasswordModal(callback) {
    const scope = this.scope.$new(true);
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
    const scope = this.scope.$new(true);
    scope.uuid = uuid;
    scope.content = content;
    scope.application = this;
    const el = this.$compile(
      `<revision-preview-modal application='application' uuid='uuid' content='content' 
      class='sk-modal'></revision-preview-modal>`
    )(scope);
    angular.element(document.body).append(el);
  }
}