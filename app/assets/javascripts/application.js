import { 
  SNApplication,
  SNAlertManager
  Platforms,
  Environments
 } from 'snjs';
 import angular from 'angular';
 import { AlertManager } from '@/services/alertManager'

import { WebDeviceInterface } from '@/web_device_interface';

export class Application extends SNApplication {
  constructor(
    desktopManager
  ) {
    const deviceInterface = new WebDeviceInterface();
    super({
      platform: Platforms.Web,
      namespace: '',
      host: window._default_sync_server,
      deviceInterface: deviceInterface,
      swapClasses: [
        {
          swap: SNAlertManager,
          with: AlertManager
        }
      ]
    });
    this.desktopManager = desktopManager;
    this.overrideComponentManagerFunctions();
  }

  overrideComponentManagerFunctions() {
    function openModalComponent(component) {
      var scope = this.$rootScope.$new(true);
      scope.component = component;
      var el = this.$compile("<component-modal component='component' class='sk-modal'></component-modal>")(scope);
      angular.element(document.body).append(el);
    }

    function presentPermissionsDialog(dialog) {
      const scope = this.$rootScope.$new(true);
      scope.permissionsString = dialog.permissionsString;
      scope.component = dialog.component;
      scope.callback = dialog.callback;

      var el = this.$compile("<permissions-modal component='component' permissions-string='permissionsString' callback='callback' class='sk-modal'></permissions-modal>")(scope);
      angular.element(document.body).append(el);
    }

    this.componentManager.openModalComponent = openModalComponent;
    this.componentManager.presentPermissionsDialog = presentPermissionsDialog;
    this.componentManager.setDesktopManager(this.desktopManager);
  }
}