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

      this.setUser = function(user) {
        this.user = user;
      }

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
          callback(user);
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
          Neeto.crypto.computeEncryptionKeysForUser(_.merge({email: email, password: password}, authParams), function(keys){
            this.setMk(keys.mk);
            var request = Restangular.one("auth/sign_in");
            var params = {password: keys.pw, email: email};
            _.merge(request, params);
            request.post().then(function(response){
              localStorage.setItem("jwt", response.token);
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
            callback(response);
          })
          .catch(function(response){
            callback(response.data);
          })
        }.bind(this));
      }

      this.changePassword = function(user, current_password, new_password) {
          this.getAuthParamsForEmail(email, function(authParams){
            if(!authParams) {
              callback(null);
              return;
            }
            Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: current_password, email: user.email}, authParams), function(currentKeys) {
              Neeto.crypto.computeEncryptionKeysForUser(_.merge({password: new_password, email: user.email}, authParams), function(newKeys){
                var data = {};
                data.current_password = currentKeys.pw;
                data.password = newKeys.pw;
                data.password_confirmation = newKeys.pw;

                var user = this.user;

                this._performPasswordChange(currentKeys, newKeys, function(response){
                  if(response && !response.error) {
                    // this.showNewPasswordForm = false;
                    // reencrypt data with new mk
                    this.reencryptAllItemsAndSave(user, newKeys.mk, currentKeys.mk, function(success){
                      if(success) {
                        this.setMk(newKeys.mk);
                        alert("Your password has been changed and your data re-encrypted.");
                      } else {
                        // rollback password
                        this._performPasswordChange(newKeys, currentKeys, function(response){
                          alert("There was an error changing your password. Your password has been rolled back.");
                          window.location.reload();
                        })
                      }
                    }.bind(this));
                  } else {
                    // this.showNewPasswordForm = false;
                    alert("There was an error changing your password. Please try again.");
                  }
                }.bind(this))
              }.bind(this));
            }.bind(this));
          }.bind(this));
      }

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

      this.setUsername = function(user, username, callback) {
        var request = Restangular.one("users", user.uuid);
        request.username = username;
        request.patch().then(function(response){
          callback(response.plain());
        })
      }

      /*
      Ensures that if encryption is disabled, all local items are uncrypted,
      and that if it's enabled, that all local items are encrypted
      */
      this.verifyEncryptionStatusOfAllItems = function(user, callback) {
        var allItems = user.filteredItems();
        var itemsNeedingUpdate = [];
        allItems.forEach(function(item){
          if(!item.isPublic()) {
            if(item.encryptionEnabled() && !item.isEncrypted()) {
              itemsNeedingUpdate.push(item);
            }
          } else {
            if(item.isEncrypted()) {
              itemsNeedingUpdate.push(item);
            }
          }
        }.bind(this))

        if(itemsNeedingUpdate.length > 0) {
          console.log("verifying encryption, items need updating", itemsNeedingUpdate);
          this.saveBatchItems(user, itemsNeedingUpdate, callback)
        }
      }



      /*
      Items
      */

      this.syncWithOptions = function(callback, options = {}) {
        if(!this.user.uuid) {
          this.writeItemsToLocalStorage(function(responseItems){
            this.handleItemsResponse(responseItems);
            modelManager.clearDirtyItems();
            if(callback) {
              callback();
            }
          }.bind(this))
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
          this.syncToken = response.sync_token;
          $rootScope.$broadcast("sync:updated_token", this.syncToken);

          this.handleItemsResponse(response.retrieved_items, null);
          // merge only metadata for saved items
          var omitFields = ["content", "enc_item_key", "auth_hash"];
          this.handleItemsResponse(response.saved_items, omitFields);

          if(callback) {
            callback(response);
          }
        }.bind(this))
        .catch(function(response){
          console.log("Sync error: ", response);
          callback(null);
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

      this.paramsForExportFile = function(item) {
        return _.omit(this.paramsForItem(item, false, ["created_at", "updated_at"], true), ["deleted"]);
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
        if(!this.user.uuid) {
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
              user: function() {return this.user}.bind(this),
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

      this.importJSONData = function(jsonString, callback) {
        var data = JSON.parse(jsonString);
        modelManager.mapResponseItemsToLocalModels(data.items);
        modelManager.items.forEach(function(item){
          item.setDirty(true);
        })
        this.syncWithOptions(callback, {additionalFields: ["created_at", "updated_at"]});
      }

      /*
      Export
      */

      this.itemsDataFile = function() {
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
          return this.paramsForExportFile(item);
        }.bind(this));

        var data = {
          items: items
        }

        return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
      }



      /*
      Merging
      */
      this.mergeLocalDataRemotely = function(user, callback) {
        var request = Restangular.one("users", user.uuid).one("merge");
        var tags = user.tags;
        request.items = user.items;
        request.items.forEach(function(item){
          if(item.tag_id) {
            var tag = tags.filter(function(tag){return tag.uuid == item.tag_id})[0];
            item.tag_name = tag.title;
          }
        })
        request.post().then(function(response){
          callback();
          localStorage.removeItem('user');
        })
      }






      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

      this.writeItemsToLocalStorage = function(callback) {
        var items = _.map(modelManager.items, function(item){
          return this.paramsForItem(item, false, ["created_at", "updated_at"], false)
        }.bind(this));
        console.log("writing items to local", items);
        this.writeToLocalStorage('items', items);
        callback(items);
      }

      this.writeToLocalStorage = function(key, value) {
        localStorage.setItem(key, angular.toJson(value));
      }

      this.loadLocalItemsAndUser = function() {
        var user = {};
        var items = JSON.parse(localStorage.getItem('items')) || [];
        items = this.handleItemsResponse(items);
        Item.sortItemsByDate(items);
        user.items = items;
        user.shouldMerge = true;
        return user;
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
         for (var item of items) {
           if(item.deleted == true) {
             continue;
           }

           if(item.content.substring(0, 3) == "001" && item.enc_item_key) {
             // is encrypted
             this.decryptSingleItem(item, masterKey);
           } else {
             // is base64 encoded
             item.content = Neeto.crypto.base64Decode(item.content.substring(3, item.content.length))
           }
         }
       }

       this.reencryptAllItemsAndSave = function(user, newMasterKey, oldMasterKey, callback) {
         var items = user.filteredItems();
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
