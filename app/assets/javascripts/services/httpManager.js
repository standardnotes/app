import { SFHttpManager } from 'snjs';

export class HttpManager extends SFHttpManager {
  /* @ngInject */
  constructor(storageManager, $timeout) {
    // calling callbacks in a $timeout allows UI to update
    super($timeout);

    this.setJWTRequestHandler(async () => {
      return storageManager.getItem('jwt');
    });
  }
}
