angular.module('app')
  .provider('authManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager) {
      return new AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager);
    }

    function AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager, singletonManager) {

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
          return "003";
        } else {
          return "001";
        }
      }

      this.costMinimumForVersion = function(version) {
        // all current versions have a min of 3000
        // future versions will increase this
        return SFJS.crypto.costMinimumForVersion(version);
      }

      this.isProtocolVersionSupported = function(version) {
        return SFJS.crypto.supportedVersions().includes(version);
      }

      /* Upon sign in to an outdated version, the user will be presented with an alert requiring them to confirm
      understanding they are signing in with an older version of the protocol, and must upgrade immediately after completing sign in.
      */
      this.isProtocolVersionOutdated = function(version) {
        return ["001"].includes(version);
      }

      this.supportsPasswordDerivationCost = function(cost) {
        return SFJS.crypto.supportsPasswordDerivationCost(cost);
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

      this.login = function(url, email, password, ephemeral, extraParams, callback) {
        this.getAuthParamsForEmail(url, email, extraParams, function(authParams){

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
            if(SFJS.crypto.isVersionNewerThanLibraryVersion(authParams.version)) {
              // The user has a new account type, but is signing in to an older client.
              message = "This version of the application does not support your newer account type. Please upgrade to the latest version of Standard Notes to sign in.";
            } else {
              // The user has a very old account type, which is no longer supported by this client
              message = "The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.org/help/security for more information.";
            }
            callback({error: {message: message}});
            return;
          }

          if(this.isProtocolVersionOutdated(authParams.version)) {
            let message = `The encryption version for your account, ${authParams.version}, is outdated. You may proceed with login, but are advised to follow prompts for Security Updates once inside. Please visit standardnotes.org/help/security for more information.\n\nClick 'OK' to proceed with login.`
            if(!confirm(message)) {
              return;
            }
          }

          if(!this.supportsPasswordDerivationCost(authParams.pw_cost)) {
            let message = "Your account was created on a platform with higher security capabilities than this browser supports. " +
            "If we attempted to generate your login keys here, it would take hours. " +
            "Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to log in."
            callback({error: {message: message}});
            return;
          }

          var minimum = this.costMinimumForVersion(authParams.version);
          if(authParams.pw_cost < minimum) {
            let message = "Unable to login due to insecure password parameters. Please visit standardnotes.org/help/security for more information.";
            callback({error: {message: message}});
            return;
          }

          SFJS.crypto.computeEncryptionKeysForUser(password, authParams, function(keys){
            console.log("Signing in with params", authParams, keys);
            var requestUrl = url + "/auth/sign_in";
            var params = _.merge({password: keys.pw, email: email}, extraParams);
            httpManager.postAbsolute(requestUrl, params, function(response){
              this.setEphemeral(ephemeral);
              this.handleAuthResponse(response, email, url, authParams, keys);
              this.checkForSecurityUpdate();
              callback(response);
            }.bind(this), function(response){
              console.error("Error logging in", response);
              if(typeof response !== 'object') {
                response = {error: {message: "A server error occurred while trying to sign in. Please try again."}};
              }
              callback(response);
            })

          }.bind(this));
        }.bind(this))
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
        SFJS.crypto.generateInitialEncryptionKeysForUser(email, password, (keys, authParams) => {
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

      this.changePassword = function(current_password, new_password, callback) {
        let email = this.user.email;
        SFJS.crypto.generateInitialEncryptionKeysForUser(email, new_password, (keys, authParams) => {
          var requestUrl = storageManager.getItem("server") + "/auth/change_pw";
          var params = _.merge({current_password: current_password, new_password: keys.pw}, authParams);

          httpManager.postAbsolute(requestUrl, params, (response) => {
            this.handleAuthResponse(response, email, null, authParams, keys);
            callback(response);
          }, (response) => {
            var error = response;
            if(!error) {
              error = {message: "Something went wrong while changing your password. Your password was not changed. Please try again."}
            }
            console.error("Change pw error", response);
            callback({error: error});
          })
        })
      }

      this.updateAuthParams = function(authParams, callback) {
        var requestUrl = storageManager.getItem("server") + "/auth/update";
        var params = authParams;
        httpManager.postAbsolute(requestUrl, params, function(response) {
          storageManager.setItem("auth_params", JSON.stringify(authParams));
          if(callback) {
            callback(response);
          }
        }.bind(this), function(response){
          var error = response;
          console.error("Update error:", response);
          if(callback) {
            callback({error: error});
          }
        })
      }


      this.checkForSecurityUpdate = function() {
        if(this.offline()) {
          return;
        }

        let latest = SFJS.crypto.version();

        if(this.protocolVersion() !== latest) {
          // Prompt user to perform security update
        }
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
