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
        return JSON.parse(localStorage.getItem("auth_params"));
      }

      this.keys = function() {
        var mk =  localStorage.getItem("mk");
        if(!mk) {
          return null;
        }
        var keys = {mk: mk, ak: localStorage.getItem("ak")};
        return keys;
      }

      this.encryptionVersion = function() {
        var keys = this.keys();
        if(keys && keys.ak) {
          return "002";
        } else {
          return "001";
        }
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
          if(!authParams.pw_cost) {
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

            var uploadVTagOnCompletion = false;
            var localVTag = Neeto.crypto.calculateVerificationTag(authParams.pw_cost, authParams.pw_salt, keys.ak);

            if(authParams.pw_auth) {
              // verify auth params
              if(localVTag !== authParams.pw_auth) {
                alert("Invalid server verification tag; aborting login. This could also be caused by an incorrect password. Learn more at standardnotes.org/verification.");
                $timeout(function(){
                  callback({error: true, didDisplayAlert: true});
                })
                return;
              } else {
                console.log("Verification tag success.");
              }
            } else {
              // either user has not uploaded pw_auth, or server is attempting to bypass authentication
              if(confirm("Unable to locate verification tag for server. If this is your first time seeing this message and your account was created before July 2017, press OK to upload verification tag. If your account was created after July 2017, or if you've already seen this message, press cancel to abort login. Learn more at standardnotes.org/verification.")) {
                // upload verification tag on completion
                uploadVTagOnCompletion = true;
              } else {
                return;
              }
            }

            var requestUrl = url + "/auth/sign_in";
            var params = {password: keys.pw, email: email};
            httpManager.postAbsolute(requestUrl, params, function(response){
              this.handleAuthResponse(response, email, url, authParams, keys);
              callback(response);
              if(uploadVTagOnCompletion) {
                this.uploadVerificationTag(localVTag, authParams);
              }
            }.bind(this), function(response){
              console.error("Error logging in", response);
              callback(response);
            })

          }.bind(this));
        }.bind(this))
      }

      this.uploadVerificationTag = function(tag, authParams) {
        var requestUrl = localStorage.getItem("server") + "/auth/update";
        var params = {pw_auth: tag};

        httpManager.postAbsolute(requestUrl, params, function(response){
          _.merge(authParams, params);
          localStorage.setItem("auth_params", JSON.stringify(authParams));
          alert("Your verification tag was successfully uploaded.");
        }.bind(this), function(response){
          alert("There was an error uploading your verification tag.");
        })
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

     }
});
