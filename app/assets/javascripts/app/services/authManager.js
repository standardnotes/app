import angular from 'angular';
import { StorageManager } from './storageManager';
import { cryptoManager, SFItem, SFPredicate, SFAuthManager } from 'snjs';

export class AuthManager extends SFAuthManager {
  /* @ngInject */
  constructor(
    modelManager,
    singletonManager,
    storageManager,
    dbManager,
    httpManager,
    $rootScope,
    $timeout,
    $compile
  ) {
    super(storageManager, httpManager, null, $timeout);
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.modelManager = modelManager;
    this.singletonManager = singletonManager;
    this.storageManager = storageManager;
    this.dbManager = dbManager;
  }

  loadInitialData() {
    var userData = this.storageManager.getItemSync("user");
    if(userData) {
      this.user = JSON.parse(userData);
    } else {
      // legacy, check for uuid
      var idData = this.storageManager.getItemSync("uuid");
      if(idData) {
        this.user = {uuid: idData};
      }
    }

    this.configureUserPrefs();
    this.checkForSecurityUpdate();

    this.modelManager.addItemSyncObserver("user-prefs", "SN|UserPreferences", (allItems, validItems, deletedItems, source, sourceKey) => {
      this.userPreferencesDidChange();
    });

  }

  offline() {
    return !this.user;
  }

  isEphemeralSession() {
    if(this.ephemeral == null || this.ephemeral == undefined) {
      this.ephemeral = JSON.parse(this.storageManager.getItemSync("ephemeral", StorageManager.Fixed));
    }
    return this.ephemeral;
  }

  setEphemeral(ephemeral) {
    this.ephemeral = ephemeral;
    if(ephemeral) {
      this.storageManager.setModelStorageMode(StorageManager.Ephemeral);
      this.storageManager.setItemsMode(StorageManager.Ephemeral);
    } else {
      this.storageManager.setModelStorageMode(StorageManager.Fixed);
      this.storageManager.setItemsMode(this.storageManager.bestStorageMode());
      this.storageManager.setItem("ephemeral", JSON.stringify(false), StorageManager.Fixed);
    }
  }

  async getAuthParamsForEmail(url, email, extraParams) {
    return super.getAuthParamsForEmail(url, email, extraParams);
  }

  async login(url, email, password, ephemeral, strictSignin, extraParams) {
    return super.login(url, email, password, strictSignin, extraParams).then((response) => {
      if(!response.error) {
        this.setEphemeral(ephemeral);
        this.checkForSecurityUpdate();
      }

      return response;
    })
  }

  async register(url, email, password, ephemeral) {
    return super.register(url, email, password).then((response) => {
      if(!response.error) {
        this.setEphemeral(ephemeral);
      }
      return response;
    })
  }

  async changePassword(url, email, current_server_pw, newKeys, newAuthParams) {
    return super.changePassword(url, email, current_server_pw, newKeys, newAuthParams).then((response) => {
      if(!response.error) {
        this.checkForSecurityUpdate();
      }
      return response;
    })
  }

  async handleAuthResponse(response, email, url, authParams, keys) {
    try {
      await super.handleAuthResponse(response, email, url, authParams, keys);
      this.user = response.user;
      this.storageManager.setItem("user", JSON.stringify(response.user));
    } catch (e) {
      this.dbManager.displayOfflineAlert();
    }
  }

  async verifyAccountPassword(password) {
    let authParams = await this.getAuthParams();
    let keys = await cryptoManager.computeEncryptionKeysForUser(password, authParams);
    let success = keys.mk === (await this.keys()).mk;
    return success;
  }

  async checkForSecurityUpdate() {
    if(this.offline()) {
      return false;
    }

    let latest = cryptoManager.version();
    let updateAvailable = await this.protocolVersion() !== latest;
    if(updateAvailable !== this.securityUpdateAvailable) {
      this.securityUpdateAvailable = updateAvailable;
      this.$rootScope.$broadcast("security-update-status-changed");
    }

    return this.securityUpdateAvailable;
  }

  presentPasswordWizard(type) {
    var scope = this.$rootScope.$new(true);
    scope.type = type;
    var el = this.$compile( "<password-wizard type='type'></password-wizard>" )(scope);
    angular.element(document.body).append(el);
  }

  signOut() {
    super.signout();
    this.user = null;
    this._authParams = null;
  }


  /* User Preferences */

  configureUserPrefs() {
    let prefsContentType = "SN|UserPreferences";

    let contentTypePredicate = new SFPredicate("content_type", "=", prefsContentType);
    this.singletonManager.registerSingleton([contentTypePredicate], (resolvedSingleton) => {
      this.userPreferences = resolvedSingleton;
    }, (valueCallback) => {
      // Safe to create. Create and return object.
      var prefs = new SFItem({content_type: prefsContentType});
      this.modelManager.addItem(prefs);
      this.modelManager.setItemDirty(prefs, true);
      this.$rootScope.sync();
      valueCallback(prefs);
    });
  }

  userPreferencesDidChange() {
    this.$rootScope.$broadcast("user-preferences-changed");
  }

  syncUserPreferences() {
    if(this.userPreferences) {
      this.modelManager.setItemDirty(this.userPreferences, true);
      this.$rootScope.sync();
    }
  }

  getUserPrefValue(key, defaultValue) {
    if(!this.userPreferences) { return defaultValue; }
    var value = this.userPreferences.getAppDataItem(key);
    return (value !== undefined && value != null) ? value : defaultValue;
  }

  setUserPrefValue(key, value, sync) {
    if(!this.userPreferences) { console.log("Prefs are null, not setting value", key); return; }
    this.userPreferences.setAppDataItem(key, value);
    if(sync) {
      this.syncUserPreferences();
    }
  }
}
