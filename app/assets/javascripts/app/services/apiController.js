angular.module('app.frontend')
  .provider('apiController', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    var url;

    this.defaultServerURL = function() {
      if(!url) {
        url = localStorage.getItem("server");
        if(!url) {
          url = "https://n3.standardnotes.org";
        }
      }
      return url;
    }


    this.$get = function($rootScope, Restangular, modelManager, ngDialog) {
        return new ApiController($rootScope, Restangular, modelManager, ngDialog);
    }

    function ApiController($rootScope, Restangular, modelManager, ngDialog) {

      this.user = {};
      this.syncToken = localStorage.getItem("syncToken");

      /*
      Config
      */

      this.getServer = function() {
        if(!url) {
          url = localStorage.getItem("server");
          if(!url) {
            url = "https://n3.standardnotes.org";
            this.setServer(url);
          }
        }
        return url;
      }

      this.setServer = function(url, refresh) {
        localStorage.setItem("server", url);
        if(refresh) {
          window.location.reload();
        }
      }


      /*
      Auth
      */

      this.getAuthParams = function() {
        return JSON.parse(localStorage.getItem("auth_params"));
      }

      this.isUserSignedIn = function() {
        return localStorage.getItem("jwt");
      }

      this.userId = function() {
        return localStorage.getItem("uuid");
      }

      this.getAuthParamsForEmail = function(email, callback) {
        var request = Restangular.one("auth", "params");
        request.get({email: email}).then(function(response){
          callback(response.plain());
        })
        .catch(function(response){
          console.log("Error getting current user", response);
          callback(response.data);
        })
      }

      this.getCurrentUser = function(callback) {
        if(!localStorage.getItem("jwt")) {
          callback(null);
          return;
        }
        Restangular.one("users/current").get().then(function(response){
          var user = response.plain();
          _.merge(this.user, user);
          callback();
        }.bind(this))
        .catch(function(response){
          console.log("Error getting current user", response);
          callback(response.data);
        })
      }

      this.login = function(email, password, callback) {
        this.getAuthParamsForEmail(email, function(authParams){
          if(!authParams) {
            callback(null);
            return;
          }
          Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, authParams), function(keys){
            this.setMk(keys.mk);
            var request = Restangular.one("auth/sign_in");
            var params = {password: keys.pw, email: email};
            _.merge(request, params);
            request.post().then(function(response){
              localStorage.setItem("jwt", response.token);
              localStorage.setItem("uuid", response.uuid);
              localStorage.setItem("auth_params", JSON.stringify(authParams));
              callback(response);
            })
            .catch(function(response){
              callback(response.data);
            })
          }.bind(this));
        }.bind(this))
      }

      this.register = function(email, password, callback) {
        Neeto.crypto.generateInitialEncryptionKeysForUser({password: password, email: email}, function(keys){
          this.setMk(keys.mk);
          keys.mk = null;
          var request = Restangular.one("auth");
          var params = _.merge({password: keys.pw, email: email}, keys);
          _.merge(request, params);
          request.post().then(function(response){
            localStorage.setItem("jwt", response.token);
            localStorage.setItem("uuid", response.uuid);
            localStorage.setItem("auth_params", JSON.stringify(authParams));
            callback(response);
          })
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

      this._performPasswordChange = function(email, current_keys, new_keys, callback) {
        var request = Restangular.one("auth");
        var params = {password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email};
        _.merge(request, params);
        request.patch().then(function(response){
          callback(response);
        })
      }


      /*
      User
      */

      this.setUsername = function(username, callback) {
        var request = Restangular.one("users", this.userId());
        request.username = username;
        request.patch().then(function(response){
          this.user.username = response.username;
          callback(response.plain());
        }.bind(this))
      }


      /*
      Items
      */

      this.setSyncToken = function(syncToken) {
        this.syncToken = syncToken;
        localStorage.setItem("syncToken", this.syncToken);
      }

      this.syncWithOptions = function(callback, options = {}) {
        this.writeAllItemsToLocalStorage(function(responseItems){
          if(!this.isUserSignedIn()) {
            // is not signed in
            modelManager.clearDirtyItems();
            if(callback) {
              callback();
            }
          }
        }.bind(this))

        if(!this.isUserSignedIn()) {
          return;
        }

        var dirtyItems = modelManager.getDirtyItems();
        var request = Restangular.one("items/sync");
        request.items = _.map(dirtyItems, function(item){
          return this.createRequestParamsForItem(item, options.additionalFields);
        }.bind(this));

        // console.log("syncing items", request.items);

        if(this.syncToken) {
          request.sync_token = this.syncToken;
        }

        request.post().then(function(response) {
          modelManager.clearDirtyItems();
          this.setSyncToken(response.sync_token);
          $rootScope.$broadcast("sync:updated_token", this.syncToken);

          this.handleItemsResponse(response.retrieved_items, null);
          // merge only metadata for saved items
          var omitFields = ["content", "enc_item_key", "auth_hash"];
          this.handleItemsResponse(response.saved_items, omitFields);

          this.writeAllItemsToLocalStorage();

          if(callback) {
            callback(response);
          }
        }.bind(this))
        .catch(function(response){
          console.log("Sync error: ", response);
          if(callback) {
            callback({error: "Sync error"});
          }
        })
      }

      this.sync = function(callback) {
        this.syncWithOptions(callback, undefined);
      }

      this.handleItemsResponse = function(responseItems, omitFields) {
        this.decryptItems(responseItems);
        return modelManager.mapResponseItemsToLocalModelsOmittingFields(responseItems, omitFields);
      }

      this.createRequestParamsForItem = function(item, additionalFields) {
        return this.paramsForItem(item, !item.isPublic(), additionalFields, false);
      }

      this.paramsForExportFile = function(item, encrypted) {
        return _.omit(this.paramsForItem(item, encrypted, ["created_at", "updated_at"], true), ["deleted"]);
      }

      this.paramsForExtension = function(item, encrypted) {
        return _.omit(this.paramsForItem(item, encrypted, ["created_at", "updated_at"], true), ["deleted"]);
      }

      this.paramsForItem = function(item, encrypted, additionalFields, forExportFile) {
        var itemCopy = _.cloneDeep(item);

        console.assert(!item.dummy, "Item is dummy, should not have gotten here.", item.dummy)

        var params = {uuid: item.uuid, content_type: item.content_type,
          presentation_name: item.presentation_name, deleted: item.deleted};

        if(encrypted) {
          this.encryptSingleItem(itemCopy, this.retrieveMk());
          params.content = itemCopy.content;
          params.enc_item_key = itemCopy.enc_item_key;
          params.auth_hash = itemCopy.auth_hash;
        }
        else {
          params.content = forExportFile ? itemCopy.createContentJSONFromProperties() : "000" + Neeto.crypto.base64(JSON.stringify(itemCopy.createContentJSONFromProperties()));
          if(!forExportFile) {
            params.enc_item_key = null;
            params.auth_hash = null;
          }
        }

        if(additionalFields) {
          _.merge(params, _.pick(item, additionalFields));
        }

        return params;
      }

      this.shareItem = function(item, callback) {
        if(!this.isUserSignedIn()) {
          alert("You must be signed in to share.");
          return;
        }

        var shareFn = function() {
          item.presentation_name = "_auto_";
          var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
          needsUpdate.forEach(function(needingUpdate){
            needingUpdate.setDirty(true);
          })
          this.sync();
        }.bind(this)

        if(!this.user.username) {
          ngDialog.open({
            template: 'frontend/modals/username.html',
            controller: 'UsernameModalCtrl',
            resolve: {
              callback: function() {
                return shareFn;
              }
            },
            className: 'ngdialog-theme-default',
            disableAnimation: true
          });
        } else {
          shareFn();
        }
      }

      this.unshareItem = function(item, callback) {
        item.presentation_name = null;
        var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
        needsUpdate.forEach(function(needingUpdate){
          needingUpdate.setDirty(true);
        })
        this.sync(null);
      }

      /*
      Import
      */

      this.importJSONData = function(data, password, callback) {
        console.log("Importing data", data);

        var onDataReady = function() {
          modelManager.mapResponseItemsToLocalModels(data.items);
          modelManager.allItems.forEach(function(item){
            item.setDirty(true);
          })
          this.syncWithOptions(callback, {additionalFields: ["created_at", "updated_at"]});
        }.bind(this)

        if(data.auth_params) {
          Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: password}, data.auth_params), function(keys){
            var mk = keys.mk;
            try {
              this.decryptItemsWithKey(data.items, mk);
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

      this.itemsDataFile = function(encrypted) {
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
          return this.paramsForExportFile(item, encrypted);
        }.bind(this));

        var data = {
          items: items
        }

        if(encrypted) {
          data["auth_params"] = this.getAuthParams();
        }

        return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
      }



      /*
      Merging
      */
      // this.mergeLocalDataRemotely = function(user, callback) {
      //   var request = Restangular.one("users", this.userId()).one("merge");
      //   var tags = user.tags;
      //   request.items = user.items;
      //   request.items.forEach(function(item){
      //     if(item.tag_id) {
      //       var tag = tags.filter(function(tag){return tag.uuid == item.tag_id})[0];
      //       item.tag_name = tag.title;
      //     }
      //   })
      //   request.post().then(function(response){
      //     callback();
      //     localStorage.removeItem('user');
      //   })
      // }




      this.clearLocalStorage = function() {
        localStorage.removeItem("items");
        localStorage.removeItem("mk");
        localStorage.removeItem("jwt");
        localStorage.removeItem("uuid");
        localStorage.removeItem("syncToken");
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

      this.writeAllItemsToLocalStorage = function(callback) {
        var items = _.map(modelManager.allItems, function(item){
          return this.paramsForItem(item, this.isUserSignedIn(), ["created_at", "updated_at"], false)
        }.bind(this));
        // console.log("Writing items to local", items);
        this.writeToLocalStorage('items', items);
        if(callback) {
          callback(items);
        }
      }

      this.writeToLocalStorage = function(key, value) {
        localStorage.setItem(key, angular.toJson(value));
      }

      this.loadLocalItems = function() {
        var items = JSON.parse(localStorage.getItem('items')) || [];
        items = this.handleItemsResponse(items, null);
        Item.sortItemsByDate(items);
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


      /*
      Encrpytion
      */

      this.retrieveMk = function() {
        if(!this.mk) {
          this.mk = localStorage.getItem("mk");
        }
        return this.mk;
      }

      this.setMk = function(mk) {
        localStorage.setItem('mk', mk);
      }

      this.signout = function() {
        localStorage.removeItem("jwt");
        localStorage.removeItem("mk");
      }

      this.encryptSingleItem = function(item, masterKey) {
        var item_key = null;
        if(item.enc_item_key) {
          item_key = Neeto.crypto.decryptText(item.enc_item_key, masterKey);
        } else {
          item_key = Neeto.crypto.generateRandomEncryptionKey();
          item.enc_item_key = Neeto.crypto.encryptText(item_key, masterKey);
        }

        var ek = Neeto.crypto.firstHalfOfKey(item_key);
        var ak = Neeto.crypto.secondHalfOfKey(item_key);
        var encryptedContent = "001" + Neeto.crypto.encryptText(JSON.stringify(item.createContentJSONFromProperties()), ek);
        var authHash = Neeto.crypto.hmac256(encryptedContent, ak);

        item.content = encryptedContent;
        item.auth_hash = authHash;
        item.local_encryption_scheme = "1.0";
      }

       this.decryptSingleItem = function(item, masterKey) {
         var item_key = Neeto.crypto.decryptText(item.enc_item_key, masterKey);

         var ek = Neeto.crypto.firstHalfOfKey(item_key);
         var ak = Neeto.crypto.secondHalfOfKey(item_key);
         var authHash = Neeto.crypto.hmac256(item.content, ak);
         if(authHash !== item.auth_hash || !item.auth_hash) {
           console.log("Authentication hash does not match.")
           return;
         }

         var content = Neeto.crypto.decryptText(item.content.substring(3, item.content.length), ek);
         item.content = content;
       }

       this.decryptItems = function(items) {
         var masterKey = this.retrieveMk();
         this.decryptItemsWithKey(items, masterKey);
       }

       this.decryptItemsWithKey = function(items, key) {
         for (var item of items) {
           if(item.deleted == true) {
             continue;
           }
           var isString = typeof item.content === 'string' || item.content instanceof String;
           if(isString) {
             if(item.content.substring(0, 3) == "001" && item.enc_item_key) {
               // is encrypted
               this.decryptSingleItem(item, key);
             } else {
               // is base64 encoded
               item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length))
             }
           }
         }
       }

       this.reencryptAllItemsAndSave = function(user, newMasterKey, oldMasterKey, callback) {
         var items = modelManager.allItems();
         items.forEach(function(item){
           if(item.content.substring(0, 3) == "001" && item.enc_item_key) {
             // first decrypt item_key with old key
             var item_key = Neeto.crypto.decryptText(item.enc_item_key, oldMasterKey);
             // now encrypt item_key with new key
             item.enc_item_key = Neeto.crypto.encryptText(item_key, newMasterKey);
           }
         });

         this.saveBatchItems(user, items, function(success) {
           callback(success);
         }.bind(this));
       }
     }
});
