angular.module('app.frontend')
  .provider('authManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, $timeout, httpManager, modelManager, dbManager) {
        return new AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager);
    }

    function AuthManager($rootScope, $timeout, httpManager, modelManager, dbManager) {

      var userData = localStorage.getItem("user");
      if(userData) {
        this.user = JSON.parse(userData);
      } else {
        // legacy, check for uuid
        var idData = localStorage.getItem("uuid");
        if(idData) {
          this.user = {uuid: idData};
        }
      }

      this.getUserAnalyticsId = function() {
        if(!this.user || !this.user.uuid) {
          return null;
        }
        // anonymize user id irreversably
        return Neeto.crypto.hmac256(this.user.uuid, Neeto.crypto.sha256(localStorage.getItem("pw")));
      }

      this.offline = function() {
        return !this.user;
      }

      this.getAuthParams = function() {
        if(!this._authParams) {
          this._authParams = JSON.parse(localStorage.getItem("auth_params"));
        }
        return this._authParams;
      }

      this.keys = function() {
        var mk =  localStorage.getItem("mk");
        if(!mk) {
          return null;
        }
        var keys = {mk: mk, ak: localStorage.getItem("ak")};
        return keys;
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

      this.login = function(url, email, password, callback) {
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
              this.handleAuthResponse(response, email, url, authParams, keys);
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
            localStorage.setItem("server", url);
          }
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("auth_params", JSON.stringify(authParams));
          localStorage.setItem("jwt", response.token);
          this.saveKeys(keys);
        } catch(e) {
          dbManager.displayOfflineAlert();
        }
      }

      this.saveKeys = function(keys) {
        localStorage.setItem("pw", keys.pw);
        localStorage.setItem("mk", keys.mk);
        localStorage.setItem("ak", keys.ak);
      }

      this.register = function(url, email, password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys, authParams){
          var requestUrl = url + "/auth";
          var params = _.merge({password: keys.pw, email: email}, authParams);

          httpManager.postAbsolute(requestUrl, params, function(response){
            this.handleAuthResponse(response, email, url, authParams, keys);
            callback(response);
          }.bind(this), function(response){
            console.error("Registration error", response);
            callback(response);
          }.bind(this))
        }.bind(this));
      }

      this.changePassword = function(email, new_password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: new_password, email: email}, function(keys, authParams){
          var requestUrl = localStorage.getItem("server") + "/auth/change_pw";
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

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

      this.signOut = function() {
        this._authParams = null;
      }

     }
});
