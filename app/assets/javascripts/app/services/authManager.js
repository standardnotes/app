angular.module('app.frontend')
  .provider('authManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, httpManager, modelManager) {
        return new AuthManager($rootScope, httpManager, modelManager);
    }

    function AuthManager($rootScope, httpManager, modelManager) {

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

      this.offline = function() {
        return !this.user;
      }

      this.getAuthParams = function() {
        return JSON.parse(localStorage.getItem("auth_params"));
      }

      this.keys = function() {
        var keys = {mk: localStorage.getItem("mk")};
        if(!localStorage.getItem("encryptionKey")) {
          _.merge(keys, Neeto.crypto.generateKeysFromMasterKey(keys.mk));
          localStorage.setItem("encryptionKey", keys.encryptionKey);
          localStorage.setItem("authKey", keys.authKey);
        } else {
          _.merge(keys, {encryptionKey: localStorage.getItem("encryptionKey"), authKey: localStorage.getItem("authKey")});
        }
        return keys;
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
          if(!authParams) {
            callback({error : {message: "Unable to get authentication parameters."}});
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

          Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, authParams), function(keys){
            var requestUrl = url + "/auth/sign_in";
            var params = {password: keys.pw, email: email};
            httpManager.postAbsolute(requestUrl, params, function(response){
              this.handleAuthResponse(response, email, url, authParams, keys.mk, keys.pw);
              callback(response);
            }.bind(this), function(response){
              console.error("Error logging in", response);
              callback(response);
            })

          }.bind(this));
        }.bind(this))
      }

      this.handleAuthResponse = function(response, email, url, authParams, mk, pw) {
        if(url) {
          localStorage.setItem("server", url);
        }
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("auth_params", JSON.stringify(_.omit(authParams, ["pw_nonce"])));
        localStorage.setItem("mk", mk);
        localStorage.setItem("pw", pw);
        localStorage.setItem("jwt", response.token);
      }

      this.register = function(url, email, password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys, authParams){
          var requestUrl = url + "/auth";
          var params = _.merge({password: keys.pw, email: email}, authParams);

          httpManager.postAbsolute(requestUrl, params, function(response){
            this.handleAuthResponse(response, email, url, authParams, keys.mk, keys.pw);
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

          httpManager.postAbsolute(requestUrl, params, function(response){
            this.handleAuthResponse(response, email, null, authParams, keys.mk, keys.pw);
            callback(response);
          }.bind(this), function(response){
            var error = response;
            if(!error) {
              error = {message: "Something went wrong while changing your password. Your password was not changed. Please try again."}
            }
            console.error("Change pw error", response);
            callback({error: error});
          })
        })
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

     }
});
