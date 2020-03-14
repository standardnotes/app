import {
  SNApplication,
  SNAlertService,
  Environments,
  platformFromString
} from 'snjs';
import { getPlatformString } from '@/utils';
import { AlertService } from '@/services/alertService';
import { WebDeviceInterface } from '@/web_device_interface';

export class Application extends SNApplication {
  /* @ngInject */
  constructor($timeout) {
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
    deviceInterface.setApplication(this);
  }
}