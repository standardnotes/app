angular.module('app.frontend')
  .provider('apiController', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    this.$get = function($rootScope, Restangular, modelManager, dbManager, keyManager, syncManager) {
        return new ApiController($rootScope, Restangular, modelManager, dbManager, keyManager, syncManager);
    }

    function ApiController($rootScope, Restangular, modelManager, dbManager, keyManager, syncManager) {

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

      /*
      Auth
      */

      this.defaultServerURL = function() {
        return localStorage.getItem("server") || "https://n3.standardnotes.org";
      }

      this.getAuthParams = function() {
        return JSON.parse(localStorage.getItem("auth_params"));
      }

      this.isUserSignedIn = function() {
        return localStorage.getItem("jwt");
      }

      this.getAuthParamsForEmail = function(url, email, callback) {
        var requestUrl = url + "/auth/params";
        var request = Restangular.oneUrl(requestUrl, requestUrl);
        request.get({email: email}).then(function(response){
          callback(response.plain());
        })
        .catch(function(response){
          console.log("Error getting current user", response);
          callback(response.data);
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
            callback({error: "Unable to get authentication parameters."});
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
              this.handleAuthResponse(response, url, authParams, mk);
              callback(response);
            }.bind(this))
            .catch(function(response){
              console.log("Error logging in", response);
              callback(response.data);
            })
          }.bind(this));
        }.bind(this))
      }

      this.handleAuthResponse = function(response, url, authParams, mk) {
        localStorage.setItem("server", url);
        localStorage.setItem("jwt", response.token);
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("auth_params", JSON.stringify(_.omit(authParams, ["pw_nonce"])));
        syncManager.addKey(syncManager.SNKeyName, mk);
        syncManager.addStandardFileSyncProvider(url);
      }

      this.register = function(url, email, password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys, authParams){
          var mk = keys.mk;
          var requestUrl = url + "/auth";
          var request = Restangular.oneUrl(requestUrl, requestUrl);
          var params = _.merge({password: keys.pw, email: email}, authParams);
          _.merge(request, params);
          request.post().then(function(response){
            this.handleAuthResponse(response, url, authParams, mk);
            callback(response);
          }.bind(this))
          .catch(function(response){
            callback(response.data);
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


      /*
      Sync
      */


      /*
      Import
      */

      this.importJSONData = function(data, password, callback) {
        console.log("Importing data", data);

        var onDataReady = function() {
          var items = modelManager.mapResponseItemsToLocalModels(data.items);
          items.forEach(function(item){
            item.setDirty(true);
            item.markAllReferencesDirty();
          })
          this.syncWithOptions(callback, {additionalFields: ["created_at", "updated_at"]});
        }.bind(this)

        if(data.auth_params) {
          Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, data.auth_params), function(keys){
            var mk = keys.mk;
            try {
              this.decryptItemsWithKey(data.items, mk);
              // delete items enc_item_key since the user's actually key will do the encrypting once its passed off
              data.items.forEach(function(item){
                item.enc_item_key = null;
                item.auth_hash = null;
              })
              onDataReady();
            }
            catch (e) {
              console.log("Error decrypting", e);
              alert("There was an error decrypting your items. Make sure the password you entered is correct and try again.");
              callback(false, null);
              return;
            }
          }.bind(this));
        } else {
          onDataReady();
        }
      }

      /*
      Export
      */

      this.itemsDataFile = function(ek) {
        var textFile = null;
        var makeTextFile = function (text) {
          var data = new Blob([text], {type: 'text/json'});

          // If we are replacing a previously generated file we need to
          // manually revoke the object URL to avoid memory leaks.
          if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
          }

          textFile = window.URL.createObjectURL(data);

          // returns a URL you can use as a href
          return textFile;
        }.bind(this);

        var items = _.map(modelManager.allItemsMatchingTypes(["Tag", "Note"]), function(item){
          var itemParams = new ItemParams(item, ek);
          return itemParams.paramsForExportFile();
        }.bind(this));

        var data = {
          items: items
        }

        if(ek.name == syncManager.SNKeyName) {
          // auth params are only needed when encrypted with a standard file key
          data["auth_params"] = this.getAuthParams();
        }

        return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }


      /*
      Drafts
      */

      this.saveDraftToDisk = function(draft) {
        localStorage.setItem("draft", JSON.stringify(draft));
      }

      this.clearDraft = function() {
        localStorage.removeItem("draft");
      }

      this.getDraft = function() {
        var draftString = localStorage.getItem("draft");
        if(!draftString || draftString == 'undefined') {
          return null;
        }
        var jsonObj = _.merge({content_type: "Note"}, JSON.parse(draftString));
        return modelManager.createItem(jsonObj);
      }

      this.signoutOfStandardFile = function(callback) {
        syncManager.removeStandardFileSyncProvider();
        dbManager.clearAllItems(function(){
          localStorage.clear();
          callback();
        });
      }
     }
});
