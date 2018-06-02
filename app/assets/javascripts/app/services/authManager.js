angular.module('app')
  .provider('authManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager, $compile) {
      return new AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager, $compile);
    }

    function AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager, $compile) {

      this.loadInitialData = function() {
        var userData = storageManager.getItem("user");
        if(userData) {
          this.user = JSON.parse(userData);
        } else {
          // legacy, check for uuid
          var idData = storageManager.getItem("uuid");
          if(idData) {
            this.user = {uuid: idData};
          }
        }

        this.checkForSecurityUpdate();
      }

      this.offline = function() {
        return !this.user;
      }

      this.isEphemeralSession = function() {
        if(this.ephemeral == null || this.ephemeral == undefined) {
          this.ephemeral = JSON.parse(storageManager.getItem("ephemeral", StorageManager.Fixed));
        }
        return this.ephemeral;
      }

      this.setEphemeral = function(ephemeral) {
        this.ephemeral = ephemeral;
        if(ephemeral) {
          storageManager.setModelStorageMode(StorageManager.Ephemeral);
          storageManager.setItemsMode(StorageManager.Ephemeral);
        } else {
          storageManager.setModelStorageMode(StorageManager.Fixed);
          storageManager.setItemsMode(storageManager.hasPasscode() ? StorageManager.FixedEncrypted : StorageManager.Fixed);
          storageManager.setItem("ephemeral", JSON.stringify(false), StorageManager.Fixed);
        }
      }

      this.getAuthParams = function() {
        if(!this._authParams) {
          this._authParams = JSON.parse(storageManager.getItem("auth_params"));
        }
        return this._authParams;
      }

      this.keys = function() {
        if(!this._keys) {
          var mk =  storageManager.getItem("mk");
          if(!mk) {
            return null;
          }
          this._keys = {mk: mk, ak: storageManager.getItem("ak")};
        }
        return this._keys;
      }

      this.protocolVersion = function() {
        var authParams = this.getAuthParams();
        if(authParams && authParams.version) {
          return authParams.version;
        }

        var keys = this.keys();
        if(keys && keys.ak) {
          // If there's no version stored, and there's an ak, it has to be 002. Newer versions would have thier version stored in authParams.
          return "002";
        } else {
          return "001";
        }
      }

      this.isProtocolVersionSupported = function(version) {
        return SFJS.supportedVersions().includes(version);
      }

      this.getAuthParamsForEmail = function(url, email, extraParams, callback) {
        var requestUrl = url + "/auth/params";
        httpManager.getAbsolute(requestUrl, _.merge({email: email}, extraParams), function(response){
          callback(response);
        }, function(response){
          console.error("Error getting auth params", response);
          if(typeof response !== 'object') {
            response = {error: {message: "A server error occurred while trying to sign in. Please try again."}};
          }
          callback(response);
        })
      }

      this.login = function(url, email, password, ephemeral, strictSignin, extraParams, callback) {
        this.getAuthParamsForEmail(url, email, extraParams, (authParams) => {

          // SF3 requires a unique identifier in the auth params
          authParams.identifier = email;

          if(authParams.error) {
            callback(authParams);
            return;
          }

          if(!authParams || !authParams.pw_cost) {
            callback({error : {message: "Invalid email or password."}});
            return;
          }

          if(!this.isProtocolVersionSupported(authParams.version)) {
            var message;
            if(SFJS.isVersionNewerThanLibraryVersion(authParams.version)) {
              // The user has a new account type, but is signing in to an older client.
              message = "This version of the application does not support your newer account type. Please upgrade to the latest version of Standard Notes to sign in.";
            } else {
              // The user has a very old account type, which is no longer supported by this client
              message = "The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.org/help/security for more information.";
            }
            callback({error: {message: message}});
            return;
          }

          if(SFJS.isProtocolVersionOutdated(authParams.version)) {
            let message = `The encryption version for your account, ${authParams.version}, is outdated and requires upgrade. You may proceed with login, but are advised to follow prompts for Security Updates once inside. Please visit standardnotes.org/help/security for more information.\n\nClick 'OK' to proceed with login.`
            if(!confirm(message)) {
              callback({error: {}});
              return;
            }
          }

          if(!SFJS.supportsPasswordDerivationCost(authParams.pw_cost)) {
            let message = "Your account was created on a platform with higher security capabilities than this browser supports. " +
            "If we attempted to generate your login keys here, it would take hours. " +
            "Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to log in."
            callback({error: {message: message}});
            return;
          }

          var minimum = SFJS.costMinimumForVersion(authParams.version);
          if(authParams.pw_cost < minimum) {
            let message = "Unable to login due to insecure password parameters. Please visit standardnotes.org/help/security for more information.";
            callback({error: {message: message}});
            return;
          }

          if(strictSignin) {
            // Refuse sign in if authParams.version is anything but the latest version
            var latestVersion = SFJS.version();
            if(authParams.version !== latestVersion) {
              let message = `Strict sign in refused server sign in parameters. The latest security version is ${latestVersion}, but your account is reported to have version ${authParams.version}. If you'd like to proceed with sign in anyway, please disable strict sign in and try again.`;
              callback({error: {message: message}});
              return;
            }
          }

          SFJS.crypto.computeEncryptionKeysForUser(password, authParams).then((keys) => {
            var requestUrl = url + "/auth/sign_in";
            var params = _.merge({password: keys.pw, email: email}, extraParams);

            httpManager.postAbsolute(requestUrl, params, (response) => {
              this.setEphemeral(ephemeral);
              this.handleAuthResponse(response, email, url, authParams, keys);
              this.checkForSecurityUpdate();
              $timeout(() => callback(response));
            }, (response) => {
              console.error("Error logging in", response);
              if(typeof response !== 'object') {
                response = {error: {message: "A server error occurred while trying to sign in. Please try again."}};
              }
              $timeout(() => callback(response));
            });

          });
        })
      }

      this.handleAuthResponse = function(response, email, url, authParams, keys) {
        try {
          if(url) {
            storageManager.setItem("server", url);
          }

          this.user = response.user;
          storageManager.setItem("user", JSON.stringify(response.user));

          this._authParams = authParams;
          storageManager.setItem("auth_params", JSON.stringify(authParams));

          storageManager.setItem("jwt", response.token);
          this.saveKeys(keys);
        } catch(e) {
          dbManager.displayOfflineAlert();
        }
      }

      this.saveKeys = function(keys) {
        this._keys = keys;
        // pw doesn't need to be saved.
        // storageManager.setItem("pw", keys.pw);
        storageManager.setItem("mk", keys.mk);
        storageManager.setItem("ak", keys.ak);
      }

      this.register = function(url, email, password, ephemeral, callback) {
        SFJS.crypto.generateInitialKeysAndAuthParamsForUser(email, password).then((results) => {
          let keys = results.keys;
          let authParams = results.authParams;

          var requestUrl = url + "/auth";
          var params = _.merge({password: keys.pw, email: email}, authParams);

          httpManager.postAbsolute(requestUrl, params, (response) => {
            this.setEphemeral(ephemeral);
            this.handleAuthResponse(response, email, url, authParams, keys);
            callback(response);
          }, (response) => {
            console.error("Registration error", response);
            if(typeof response !== 'object') {
              response = {error: {message: "A server error occurred while trying to register. Please try again."}};
            }
            callback(response);
          })
        });
      }

      this.changePassword = function(current_server_pw, newKeys, newAuthParams, callback) {
        let email = this.user.email;
        let newServerPw = newKeys.pw;

        var requestUrl = storageManager.getItem("server") + "/auth/change_pw";
        var params = _.merge({new_password: newServerPw, current_password: current_server_pw}, newAuthParams);

        httpManager.postAbsolute(requestUrl, params, (response) => {
          this.handleAuthResponse(response, email, null, newAuthParams, newKeys);
          callback(response);

          // Allows security update status to be changed if neccessary
          this.checkForSecurityUpdate();
        }, (response) => {
          if(typeof response !== 'object') {
            response = {error: {message: "Something went wrong while changing your password. Your password was not changed. Please try again."}}
          }
          callback(response);
        })
      }

      this.checkForSecurityUpdate = function() {
        if(this.offline()) {
          return false;
        }

        let latest = SFJS.version();
        let updateAvailable = this.protocolVersion() !== latest;
        if(updateAvailable !== this.securityUpdateAvailable) {
          this.securityUpdateAvailable = updateAvailable;
          $rootScope.$broadcast("security-update-status-changed");
        }

        return this.securityUpdateAvailable;
      }

      this.presentPasswordWizard = function(type) {
        var scope = $rootScope.$new(true);
        scope.type = type;
        var el = $compile( "<password-wizard type='type'></password-wizard>" )(scope);
        angular.element(document.body).append(el);
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

      this.signOut = function() {
        this._keys = null;
        this.user = null;
        this._authParams = null;
      }


      /* User Preferences */

      let prefsContentType = "SN|UserPreferences";

      singletonManager.registerSingleton({content_type: prefsContentType}, (resolvedSingleton) => {
        this.userPreferences = resolvedSingleton;
        this.userPreferencesDidChange();
      }, (valueCallback) => {
        // Safe to create. Create and return object.
        var prefs = new Item({content_type: prefsContentType});
        modelManager.addItem(prefs);
        prefs.setDirty(true);
        $rootScope.sync("authManager singletonCreate");
        valueCallback(prefs);
      });

      this.userPreferencesDidChange = function() {
        $rootScope.$broadcast("user-preferences-changed");
      }

      this.syncUserPreferences = function() {
        this.userPreferences.setDirty(true);
        $rootScope.sync("syncUserPreferences");
      }

      this.getUserPrefValue = function(key, defaultValue) {
        if(!this.userPreferences) { return defaultValue; }
        var value = this.userPreferences.getAppDataItem(key);
        return (value !== undefined && value != null) ? value : defaultValue;
      }

      this.setUserPrefValue = function(key, value, sync) {
        if(!this.userPreferences) { console.log("Prefs are null, not setting value", key); return; }
        this.userPreferences.setAppDataItem(key, value);
        if(sync) {
          this.syncUserPreferences();
        }
      }

    }
});
