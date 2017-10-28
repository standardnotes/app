angular.module('app.frontend')
  .provider('userManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager) {
        return new UserManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager);
    }

    function UserManager($rootScope, $timeout, httpManager, modelManager, dbManager, storageManager) {

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
          storageManager.setItemsMode(storageManager.hasPasscode() ? StorageManager.FixedEncrypted : StorageManager.Ephemeral);
        } else {
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
          return "002";
        } else {
          return "001";
        }
      }

      this.costMinimumForVersion = function(version) {
        // all current versions have a min of 3000
        // future versions will increase this
        return 3000;
      }

      this.isProtocolVersionSupported = function(version) {
        var supportedVersions = ["001", "002"];
        return supportedVersions.includes(version);
      }

      this.getAuthParamsForEmail = function(url, email, callback) {
        var requestUrl = url + "/auth/params";
        httpManager.getAbsolute(requestUrl, {email: email}, function(response){
          callback(response);
        }, function(response){
          console.error("Error getting auth params", response);
          callback(null);
        })
      }

      this.supportsPasswordDerivationCost = function(cost) {
        // some passwords are created on platforms with stronger pbkdf2 capabilities, like iOS,
        // which accidentally used 60,000 iterations (now adjusted), which CryptoJS can't handle here (WebCrypto can however).
        // if user has high password cost and is using browser that doesn't support WebCrypto,
        // we want to tell them that they can't login with this browser.
        if(cost > 5000) {
          return Neeto.crypto instanceof SNCryptoWeb ? true : false;
        } else {
          return true;
        }
      }

      this.login = function(url, email, password, ephemeral, callback) {
        this.getAuthParamsForEmail(url, email, function(authParams){

          if(!authParams || !authParams.pw_cost) {
            callback({error : {message: "Invalid email or password."}});
            return;
          }

          if(!this.isProtocolVersionSupported(authParams.version)) {
            alert("The protocol version associated with your account is outdated and no longer supported by this application. Please visit standardnotes.org/help/security-update for more information.");
            callback({didDisplayAlert: true});
            return;
          }

          if(!this.supportsPasswordDerivationCost(authParams.pw_cost)) {
            var string = "Your account was created on a platform with higher security capabilities than this browser supports. " +
            "If we attempted to generate your login keys here, it would take hours. " +
            "Please use a browser with more up to date security capabilities, like Google Chrome or Firefox, to login."
            alert(string)
            callback({didDisplayAlert: true});
            return;
          }

          var minimum = this.costMinimumForVersion(authParams.version);
          if(authParams.pw_cost < minimum) {
            alert("Unable to login due to insecure password parameters. Please visit standardnotes.org/help/password-upgrade for more information.");
            callback({didDisplayAlert: true});
            return;
          }

          Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, authParams), function(keys){

            var requestUrl = url + "/auth/sign_in";
            var params = {password: keys.pw, email: email};
            httpManager.postAbsolute(requestUrl, params, function(response){
              this.setEphemeral(ephemeral);

              this.handleAuthResponse(response, email, url, authParams, keys);
              storageManager.setModelStorageMode(ephemeral ? StorageManager.Ephemeral : StorageManager.Fixed);

              this.checkForSecurityUpdate();

              callback(response);
            }.bind(this), function(response){
              console.error("Error logging in", response);
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
        storageManager.setItem("pw", keys.pw);
        storageManager.setItem("mk", keys.mk);
        storageManager.setItem("ak", keys.ak);
      }

      this.register = function(url, email, password, ephemeral, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys, authParams){
          var requestUrl = url + "/auth";
          var params = _.merge({password: keys.pw, email: email}, authParams);

          httpManager.postAbsolute(requestUrl, params, function(response){
            this.setEphemeral(ephemeral);

            this.handleAuthResponse(response, email, url, authParams, keys);

            storageManager.setModelStorageMode(ephemeral ? StorageManager.Ephemeral : StorageManager.Fixed);

            callback(response);
          }.bind(this), function(response){
            console.error("Registration error", response);
            callback(response);
          }.bind(this))
        }.bind(this));
      }

      this.changePassword = function(email, new_password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: new_password, email: email}, function(keys, authParams){
          var requestUrl = storageManager.getItem("server") + "/auth/change_pw";
          var params = _.merge({new_password: keys.pw}, authParams);

          httpManager.postAbsolute(requestUrl, params, function(response) {
            this.handleAuthResponse(response, email, null, authParams, keys);
            callback(response);
          }.bind(this), function(response){
            var error = response;
            if(!error) {
              error = {message: "Something went wrong while changing your password. Your password was not changed. Please try again."}
            }
            console.error("Change pw error", response);
            callback({error: error});
          })
        }.bind(this))
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

        if(this.protocolVersion() === "001") {
          if(this.keys().ak) {
            // upgrade to 002
            var authParams = this.getAuthParams();
            authParams.version = "002";
            this.updateAuthParams(authParams, function(response){
                if(!response.error) {
                  // let rest of UI load first
                  $timeout(function(){
                    alert("Your encryption version has been updated. To take full advantage of this update, please resync all your items by clicking Account -> Advanced -> Re-encrypt All Items.")
                  }, 750);
                }
            });
          }
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

      this.userPreferences = new UserPreferences({content_type: prefsContentType, dummy: true});

      modelManager.addItemSyncObserver("user-manager", prefsContentType, function(items) {
        var newPrefs = items.filter((item) => {return item.deleted == false})[0];
        if(!newPrefs) {
          return;
        }

        if(newPrefs.uuid !== this.userPreferences.uuid && !this.userPreferences.dummy) {
          // prefs coming from server take higher priority against local copy
          // delete existing prefs. This happens in the case of starting in an offline session,
          // then signing in and retrieving prefered preferences
          modelManager.setItemToBeDeleted(this.userPreferences);
          $rootScope.sync();
        }
        this.userPreferences = newPrefs;
        this.userPreferencesDidChange();
      }.bind(this));

      this.userPreferencesDidChange = function() {
        $rootScope.$broadcast("user-preferences-changed");
      }

      $rootScope.$on("sync:completed", function(){

        if(!this.userPreferences.dummy) {
          return;
        }

        this.userPreferences.dummy = false;

        var userPrefs = modelManager.itemsForContentType(prefsContentType)[0];
        if(userPrefs) {
          this.userPreferences = userPrefs;
          this.userPreferencesDidChange();
        } else {
          modelManager.addItem(this.userPreferences);
          this.userPreferences.setDirty(true);
          $rootScope.sync();
        }
      }.bind(this))

      this.syncUserPreferences = function() {
        this.userPreferences.setDirty(true);
        $rootScope.sync();
      }

      this.getUserPref = function(key, defaultValue) {
        var value = this.userPreferences.getAppDataItem(key);
        return (value !== undefined && value != null) ? value : defaultValue;
      }


  }
});
