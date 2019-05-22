class ActionsManager {

  constructor(httpManager, modelManager, authManager, syncManager, $rootScope, $compile, $timeout) {
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.authManager = authManager;
    this.syncManager = syncManager;
    this.$rootScope = $rootScope;
    this.$compile = $compile;
    this.$timeout = $timeout;

    // Used when decrypting old items with new keys. This array is only kept in memory.
    this.previousPasswords = [];
  }

  get extensions() {
    return this.modelManager.validItemsForContentType("Extension");
  }

  extensionsInContextOfItem(item) {
    return this.extensions.filter(function(ext){
      return _.includes(ext.supported_types, item.content_type) || ext.actionsWithContextForItem(item).length > 0;
    })
  }

  /*
  Loads an extension in the context of a certain item. The server then has the chance to respond with actions that are
  relevant just to this item. The response extension is not saved, just displayed as a one-time thing.
  */
  loadExtensionInContextOfItem(extension, item, callback) {
    this.httpManager.getAbsolute(extension.url, {content_type: item.content_type, item_uuid: item.uuid}, function(response){
      this.updateExtensionFromRemoteResponse(extension, response);
      callback && callback(extension);
    }.bind(this), function(response){
      console.log("Error loading extension", response);
      if(callback) {
        callback(null);
      }
    }.bind(this))
  }

  updateExtensionFromRemoteResponse(extension, response) {
    if(response.description) { extension.description = response.description; }
    if(response.supported_types) { extension.supported_types = response.supported_types; }

    if(response.actions) {
      extension.actions = response.actions.map(function(action){
        return new Action(action);
      })
    } else {
      extension.actions = [];
    }
  }

  async executeAction(action, extension, item, callback) {

    var customCallback = (response) => {
      action.running = false;
      this.$timeout(() => {
        callback(response);
      })
    }

    action.running = true;

    let decrypted = action.access_type == "decrypted";

    var triedPasswords = [];

    let handleResponseDecryption = async (response, keys, merge) => {
      var item = response.item;

      await SFJS.itemTransformer.decryptItem(item, keys);

      if(!item.errorDecrypting) {
        if(merge) {
          var items = this.modelManager.mapResponseItemsToLocalModels([item], SFModelManager.MappingSourceRemoteActionRetrieved);
          for(var mappedItem of items) {
            this.modelManager.setItemDirty(mappedItem, true);
          }
          this.syncManager.sync();
          customCallback({item: item});
        } else {
          item = this.modelManager.createItem(item);
          customCallback({item: item});
        }
        return true;
      } else {
        // Error decrypting
        if(!response.auth_params) {
          // In some cases revisions were missing auth params. Instruct the user to email us to get this remedied.
          alert("We were unable to decrypt this revision using your current keys, and this revision is missing metadata that would allow us to try different keys to decrypt it. This can likely be fixed with some manual intervention. Please email hello@standardnotes.org for assistance.");
          return;
        }

        // Try previous passwords
        for(let passwordCandidate of this.previousPasswords) {
          if(triedPasswords.includes(passwordCandidate)) {
            continue;
          }
          triedPasswords.push(passwordCandidate);

          var keyResults = await SFJS.crypto.computeEncryptionKeysForUser(passwordCandidate, response.auth_params);
          if(!keyResults) {
            continue;
          }

          var success = await handleResponseDecryption(response, keyResults, merge);
          if(success) {
            return true;
          }
        }

        this.presentPasswordModal((password) => {
          this.previousPasswords.push(password);
          handleResponseDecryption(response, keys, merge);
        });

        return false;
      }
    }

    switch (action.verb) {
      case "get": {
        if(confirm("Are you sure you want to replace the current note contents with this action's results?")) {
          this.httpManager.getAbsolute(action.url, {}, async (response) => {
            action.error = false;
            handleResponseDecryption(response, await this.authManager.keys(), true);
          }, (response) => {
            if(response && response.error) {
              alert("An issue occurred while processing this action. Please try again.");
            }
            action.error = true;
            customCallback(null);
          })
        }
        break;
      }

      case "render": {
        this.httpManager.getAbsolute(action.url, {}, async (response) => {
          action.error = false;
          handleResponseDecryption(response, await this.authManager.keys(), false);
        }, (response) => {
          action.error = true;
          customCallback(null);
        })

        break;
      }

      case "show": {
        var win = window.open(action.url, '_blank');
        win.focus();
        customCallback();
        break;
      }

      case "post": {
        this.outgoingParamsForItem(item, extension, decrypted).then((itemParams) => {
          var params = {
            items: [itemParams] // Wrap it in an array
          }

          this.performPost(action, extension, params, (response) => {
            if(response && response.error) {
              alert("An issue occurred while processing this action. Please try again.");
            }
            customCallback(response);
          });
        })

        break;
      }

      default: {

      }
    }

    action.lastExecuted = new Date();
  }

  async outgoingParamsForItem(item, extension, decrypted = false) {
    var keys = await this.authManager.keys();
    if(decrypted) {
      keys = null;
    }
    var itemParams = new SFItemParams(item, keys, await this.authManager.getAuthParams());
    return itemParams.paramsForExtension();
  }

  performPost(action, extension, params, callback) {
    this.httpManager.postAbsolute(action.url, params, function(response){
      action.error = false;
      if(callback) {
        callback(response);
      }
    }.bind(this), function(response){
      action.error = true;
      console.log("Action error response:", response);
      if(callback) {
        callback({error: "Request error"});
      }
    })
  }

  presentRevisionPreviewModal(uuid, content) {
    var scope = this.$rootScope.$new(true);
    scope.uuid = uuid;
    scope.content = content;
    var el = this.$compile( "<revision-preview-modal uuid='uuid' content='content' class='sk-modal'></revision-preview-modal>" )(scope);
    angular.element(document.body).append(el);
  }

  presentPasswordModal(callback) {
    var scope = this.$rootScope.$new(true);
    scope.type = "password";
    scope.title = "Decryption Assistance";
    scope.message = "Unable to decrypt this item with your current keys. Please enter your account password at the time of this revision.";
    scope.callback = callback;
    var el = this.$compile( "<input-modal type='type' message='message' title='title' callback='callback'></input-modal>" )(scope);
    angular.element(document.body).append(el);
  }

}

angular.module('app').service('actionsManager', ActionsManager);
