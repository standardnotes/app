import {
  SNApplication,
  SNAlertManager,
  Environments,
  platformFromString
} from 'snjs';
import angular from 'angular';
import { getPlatformString } from '@/utils';
import { AlertManager } from '@/services/alertManager';

import { WebDeviceInterface } from '@/web_device_interface';

export class Application extends SNApplication {
  constructor() {
    const deviceInterface = new WebDeviceInterface();
    super({
      environment: Environments.Web,
      platform: platformFromString(getPlatformString()),
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
    deviceInterface.setApplication(this);
    this.overrideComponentManagerFunctions();
  }

  overrideComponentManagerFunctions() {
    function openModalComponent(component) {
      const scope = this.$rootScope.$new(true);
      scope.component = component;
      const el = this.$compile("<component-modal component='component' class='sk-modal'></component-modal>")(scope);
      angular.element(document.body).append(el);
    }
    function presentPermissionsDialog(dialog) {
      const scope = this.$rootScope.$new(true);
      scope.permissionsString = dialog.permissionsString;
      scope.component = dialog.component;
      scope.callback = dialog.callback;
      const el = this.$compile("<permissions-modal component='component' permissions-string='permissionsString' callback='callback' class='sk-modal'></permissions-modal>")(scope);
      angular.element(document.body).append(el);
    }
    this.componentManager.openModalComponent = openModalComponent;
    this.componentManager.presentPermissionsDialog = presentPermissionsDialog;
  }
}