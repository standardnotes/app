import { SFSingletonManager } from 'snjs';

export class SingletonManager extends SFSingletonManager {
  // constructor needed for angularjs injection to work
  // eslint-disable-next-line no-useless-constructor
  /* @ngInject */
  constructor(modelManager, syncManager) {
    super(modelManager, syncManager);
  }
}
