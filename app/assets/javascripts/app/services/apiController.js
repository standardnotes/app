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
          url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port: '');
        }
      }
      return url;
    }


    this.$get = function(Restangular, modelManager, ngDialog) {
        return new ApiController(Restangular, modelManager, ngDialog);
    }

    function ApiController(Restangular, modelManager, ngDialog) {

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
            url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port: '');
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

      this.getCurrentUser = function(callback) {
        if(!localStorage.getItem("jwt")) {
          callback(null);
          return;
        }
        Restangular.one("users/current").get().then(function(response){
          var plain = response.plain();
          var items = plain.items;
          this.decryptItemsWithLocalKey(items);
          items = this.mapResponseItemsToLocalModels(items);
          var user = _.omit(plain, ["items"]);
          console.log("retreived items", plain);
          callback(user, items);
        }.bind(this))
        .catch(function(error){
          callback(null);
        })
      }

      this.login = function(email, password, callback) {
        var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
        this.setGk(keys.gk);
        var request = Restangular.one("auth/sign_in.json");
        request.user = {password: keys.pw, email: email};
        request.post().then(function(response){
          localStorage.setItem("jwt", response.token);
          callback(response);
        })
      }

      this.register = function(email, password, callback) {
        var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
        this.setGk(keys.gk);
        var request = Restangular.one("auth.json");
        request.user = {password: keys.pw, email: email};
        request.post().then(function(response){
          localStorage.setItem("jwt", response.token);
          callback(response);
        })
      }

      this.changePassword = function(user, current_password, new_password) {
        var current_keys = Neeto.crypto.generateEncryptionKeysForUser(current_password, user.email);
        var new_keys = Neeto.crypto.generateEncryptionKeysForUser(new_password, user.email);

        var data = {};
        data.current_password = current_keys.pw;
        data.password = new_keys.pw;
        data.password_confirmation = new_keys.pw;

        var user = this.user;

        this._performPasswordChange(current_keys, new_keys, function(response){
          if(response && !response.errors) {
            // this.showNewPasswordForm = false;
            // reencrypt data with new gk
            this.reencryptAllItemsAndSave(user, new_keys.gk, current_keys.gk, function(success){
              if(success) {
                this.setGk(new_keys.gk);
                alert("Your password has been changed and your data re-encrypted.");
              } else {
                // rollback password
                this._performPasswordChange(new_keys, current_keys, function(response){
                  alert("There was an error changing your password. Your password has been rolled back.");
                  window.location.reload();
                })
              }
            }.bind(this));
          } else {
            // this.showNewPasswordForm = false;
            alert("There was an error changing your password. Please try again.");
          }
        })
      }

      this._performPasswordChange = function(email, current_keys, new_keys, callback) {
        var request = Restangular.one("auth");
        request.user = {password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email};
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

      this.saveDirtyItems = function(callback) {
        var dirtyItems = modelManager.dirtyItems;
        if(dirtyItems.length == 0) {
          callback();
          return;
        }

        this.saveItems(dirtyItems, function(response){
          modelManager.clearDirtyItems();
          callback();
        })
      }

      this.saveItems = function(items, callback) {
        console.log("saving items", items);
        var request = Restangular.one("users", this.user.uuid).one("items");
        request.items = _.map(items, function(item){
          return this.createRequestParamsForItem(item);
        }.bind(this));
        console.log("sending request items", request.items);

        request.post().then(function(response) {
          var savedItems = response.items;
          this.decryptItemsWithLocalKey(savedItems);
          items.forEach(function(item){
            var savedCounterpart = _.find(savedItems, {uuid: item.uuid});
            item.mergeMetadataFromItem(savedCounterpart);
          })

          console.log("response items", savedItems);
          callback(response);
        }.bind(this))
      }

      this.mapResponseItemsToLocalModels = function(items) {
        return _.map(items, function(json_obj){
          if(json_obj.content_type == "Note") {
            return new Note(json_obj);
          } else if(json_obj.content_type == "Tag") {
            return new Tag(json_obj);
          } else {
            return new Item(json_obj);
          }
        });
      }

      this.createRequestParamsForItem = function(item) {
        return this.paramsForItem(item, !item.isPublic(), null, false);
      }

      this.paramsForItem = function(item, encrypted, additionalFields, forExportFile) {
        var itemCopy = _.cloneDeep(item);

        var params = {uuid: item.uuid, content_type: item.content_type, presentation_name: item.presentation_name};

        itemCopy.content.references = _.map(itemCopy.content.references, function(reference){
          return {uuid: reference.uuid, content_type: reference.content_type};
        })

        if(encrypted) {
          this.encryptSingleItem(itemCopy, this.retrieveGk());
          params.content = itemCopy.content;
          params.loc_eek = itemCopy.loc_eek;
        }
        else {
          params.content = forExportFile ? itemCopy.content : JSON.stringify(itemCopy.content);
          if(!forExportFile) {
            params.loc_eek = null;
          }
        }

        if(additionalFields) {
          _.merge(params, _.pick(item, additionalFields));
        }

        return params;
      }


      this.deleteItem = function(item, callback) {
        if(!this.user.uuid) {
          this.writeUserToLocalStorage(this.user);
          callback(true);
        } else {
          Restangular.one("users", this.user.uuid).one("items", item.uuid).remove()
          .then(function(response) {
            callback(true);
          })
        }
      }

      this.shareItem = function(item, callback) {
        console.log("sharing item", item);
        if(!this.user.uuid) {
          alert("You must be signed in to share.");
          return;
        }

        var shareFn = function() {
          item.presentation_name = "_auto_";
          var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
          this.saveItems(needsUpdate, function(success){})
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
        console.log("unsharing item", item);
        item.presentation_name = null;
        var needsUpdate = [item].concat(item.referencesAffectedBySharingChange() || []);
        this.saveItems(needsUpdate, function(success){})
      }

      /*
      Import
      */

      this.importJSONData = function(jsonString, callback) {
        var data = JSON.parse(jsonString);
        var customModelManager = new ModelManager();
        customModelManager.items = this.mapResponseItemsToLocalModels(data.items);
        console.log("importing data", JSON.parse(jsonString));
        this.saveItems(customModelManager.items, function(response){
          callback(response);
        });
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

        var items = _.map(modelManager.items, function(item){
          return this.paramsForItem(item, false, ["created_at", "updated_at"], true)
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
            item.tag_name = tag.content.title;
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

      this.writeUserToLocalStorage = function(user) {
        var saveUser = _.cloneDeep(user);
        saveUser.items = Item.filterDummyItems(saveUser.items);
        saveUser.tags.forEach(function(tag){
          tag.items = null;
        }.bind(this))
        this.writeToLocalStorage('user', saveUser);
      }

      this.writeToLocalStorage = function(key, value) {
        localStorage.setItem(key, angular.toJson(value));
      }

      this.localUser = function() {
        var user = JSON.parse(localStorage.getItem('user'));
        if(!user) {
          user = {items: [], tags: []};
        }
        user.shouldMerge = true;
        return user;
      }

      /*
      Drafts
      */

      this.saveDraftToDisk = function(draft) {
        // localStorage.setItem("draft", JSON.stringify(draft));
      }

      this.clearDraft = function() {
        localStorage.removeItem("draft");
      }

      this.getDraft = function() {
        var draftString = localStorage.getItem("draft");
        if(!draftString || draftString == 'undefined') {
          return null;
        }
        return new Item(JSON.parse(draftString));
      }


      /*
      Encrpytion
      */

      this.retrieveGk = function() {
        if(!this.gk) {
          this.gk = localStorage.getItem("gk");
        }
        return this.gk;
      }

      this.setGk = function(gk) {
        localStorage.setItem('gk', gk);
      }

      this.signout = function() {
        localStorage.removeItem("jwt");
        localStorage.removeItem("gk");
      }

      this.encryptSingleItem = function(item, key) {
        var ek = null;
        if(item.loc_eek) {
          ek = Neeto.crypto.decryptText(item.loc_eek, key);
        } else {
          ek = Neeto.crypto.generateRandomEncryptionKey();
          item.loc_eek = Neeto.crypto.encryptText(ek, key);
        }
        item.content = Neeto.crypto.encryptText(JSON.stringify(item.content), ek);
        item.local_encryption_scheme = "1.0";
      }

      this.encryptItems = function(items, key) {
        items.forEach(function(item){
          this.encryptSingleItem(item, key);
        }.bind(this));
      }

      this.encryptSingleItemWithLocalKey = function(item) {
        this.encryptSingleItem(item, this.retrieveGk());
      }

      this.encryptItemsWithLocalKey = function(items) {
        this.encryptItems(items, this.retrieveGk());
      }

      this.encryptNonPublicItemsWithLocalKey = function(items) {
        var nonpublic = items.filter(function(item){
          return !item.isPublic() && !item.pending_share;
        })
        this.encryptItems(nonpublic, this.retrieveGk());
      }

      this.decryptSingleItemWithLocalKey = function(item) {
        this.decryptSingleItem(item, this.retrieveGk());
      }

       this.decryptSingleItem = function(item, key) {
         var ek = Neeto.crypto.decryptText(item.loc_eek || item.local_eek, key);
         var content = Neeto.crypto.decryptText(item.content, ek);
        //  console.log("decrypted contnet", content);
         item.content = content;
       }

       this.decryptItems = function(items, key) {
         items.forEach(function(item){
          //  console.log("is encrypted?", item);
           if(item.loc_eek && typeof item.content === 'string') {
             this.decryptSingleItem(item, key);
           }
         }.bind(this));
       }

       this.decryptItemsWithLocalKey = function(items) {
         this.decryptItems(items, this.retrieveGk());
       }

       this.reencryptAllItemsAndSave = function(user, newKey, oldKey, callback) {
         var items = user.filteredItems();
         items.forEach(function(item){
           if(item.loc_eek && typeof item.content === 'string') {
             // first decrypt eek with old key
             var ek = Neeto.crypto.decryptText(item.loc_eek, oldKey);
             // now encrypt ek with new key
             item.loc_eek = Neeto.crypto.encryptText(ek, newKey);
           }
         });

         this.saveBatchItems(user, items, function(success) {
           callback(success);
         }.bind(this));
       }
     }
});
