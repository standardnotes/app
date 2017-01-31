angular.module('app.frontend')
  .provider('authManager', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, Restangular, modelManager) {
        return new AuthManager($rootScope, Restangular, modelManager);
    }

    function AuthManager($rootScope, Restangular, modelManager) {

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

      this.getAuthParamsForEmail = function(url, email, callback) {
        var requestUrl = url + "/auth/params";
        var request = Restangular.oneUrl(requestUrl, requestUrl);
        request.get({email: email}).then(function(response){
          callback(response.plain());
        })
        .catch(function(response){
          console.log("Error getting auth params", response);
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
            var mk = keys.mk;
            var requestUrl = url + "/auth/sign_in";
            var request = Restangular.oneUrl(requestUrl, requestUrl);
            var params = {password: keys.pw, email: email};
            _.merge(request, params);
            request.post().then(function(response){
              this.handleAuthResponse(response, email, url, authParams, mk, keys.pw);
              callback(response);
            }.bind(this))
            .catch(function(response){
              console.log("Error logging in", response);
              callback(response.data);
            })
          }.bind(this));
        }.bind(this))
      }

      this.handleAuthResponse = function(response, email, url, authParams, mk, pw) {
        localStorage.setItem("server", url);
        localStorage.setItem("user", JSON.stringify(response.plain().user));
        localStorage.setItem("auth_params", JSON.stringify(_.omit(authParams, ["pw_nonce"])));
        localStorage.setItem("mk", mk);
        localStorage.setItem("pw", pw);
        localStorage.setItem("jwt", response.token);
      }

      this.register = function(url, email, password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys, authParams){
          var mk = keys.mk;
          var requestUrl = url + "/auth";
          var request = Restangular.oneUrl(requestUrl, requestUrl);
          var params = _.merge({password: keys.pw, email: email}, authParams);
          _.merge(request, params);
          request.post().then(function(response){
            this.handleAuthResponse(response, email, url, authParams, mk, keys.pw);
            callback(response);
          }.bind(this))
          .catch(function(response){
            console.log("Registration error", response);
            callback(null);
          })
        }.bind(this));
      }

      // this.changePassword = function(current_password, new_password) {
      //     this.getAuthParamsForEmail(email, function(authParams){
      //       if(!authParams) {
      //         callback(null);
      //         return;
      //       }
      //       Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: current_password, email: user.email}, authParams), function(currentKeys) {
      //         Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: new_password, email: user.email}, authParams), function(newKeys){
      //           var data = {};
      //           data.current_password = currentKeys.pw;
      //           data.password = newKeys.pw;
      //           data.password_confirmation = newKeys.pw;
      //
      //           var user = this.user;
      //
      //           this._performPasswordChange(currentKeys, newKeys, function(response){
      //             if(response && !response.error) {
      //               // this.showNewPasswordForm = false;
      //               // reencrypt data with new mk
      //               this.reencryptAllItemsAndSave(user, newKeys.mk, currentKeys.mk, function(success){
      //                 if(success) {
      //                   this.setMk(newKeys.mk);
      //                   alert("Your password has been changed and your data re-encrypted.");
      //                 } else {
      //                   // rollback password
      //                   this._performPasswordChange(newKeys, currentKeys, function(response){
      //                     alert("There was an error changing your password. Your password has been rolled back.");
      //                     window.location.reload();
      //                   })
      //                 }
      //               }.bind(this));
      //             } else {
      //               // this.showNewPasswordForm = false;
      //               alert("There was an error changing your password. Please try again.");
      //             }
      //           }.bind(this))
      //         }.bind(this));
      //       }.bind(this));
      //     }.bind(this));
      // }

      this._performPasswordChange = function(url, email, current_keys, new_keys, callback) {
        var requestUrl = url + "/auth";
        var request = Restangular.oneUrl(requestUrl, requestUrl);
        var params = {password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email};
        _.merge(request, params);
        request.patch().then(function(response){
          callback(response);
        })
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

     }
});
