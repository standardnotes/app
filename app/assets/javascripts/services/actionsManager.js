import _ from 'lodash';
import angular from 'angular';
import { Action, SFModelManager, SFItemParams, protocolManager } from 'snjs';

export class ActionsManager {

  /* @ngInject */
  constructor(
    $compile,
    $rootScope,
    $timeout,
    alertManager,
    authManager,
    httpManager,
    modelManager,
    syncManager,
  ) {
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.alertManager = alertManager;
    this.authManager = authManager;
    this.httpManager = httpManager;
    this.modelManager = modelManager;
    this.syncManager = syncManager;
    /* Used when decrypting old items with new keys. This array is only kept in memory. */
    this.previousPasswords = [];
  }

  get extensions() {
    return this.modelManager.validItemsForContentType('Extension');
  }

  extensionsInContextOfItem(item) {
    return this.extensions.filter((ext) => {
      return _.includes(ext.supported_types, item.content_type) ||
        ext.actionsWithContextForItem(item).length > 0;
    });
  }

  /**
   * Loads an extension in the context of a certain item. 
   * The server then has the chance to respond with actions that are
   * relevant just to this item. The response extension is not saved, 
   * just displayed as a one-time thing.
  */
  async loadExtensionInContextOfItem(extension, item) {
    const params = {
      content_type: item.content_type,
      item_uuid: item.uuid
    };
    const emptyFunc = () => { };
    return this.httpManager.getAbsolute(
      extension.url, 
      params, 
      emptyFunc,
      emptyFunc
    ).then((response) => {
      this.updateExtensionFromRemoteResponse(extension, response);
      return extension;
    }).catch((response) => {
      console.error("Error loading extension", response);
      return null;
    });
  }

  updateExtensionFromRemoteResponse(extension, response) {
    if (response.description) {
      extension.description = response.description;
    }
    if (response.supported_types) {
      extension.supported_types = response.supported_types;
    }
    if (response.actions) {
      extension.actions = response.actions.map((action) => {
        return new Action(action);
      })
    } else {
      extension.actions = [];
    }
  }

  async executeAction(action, extension, item) {
    action.running = true;
    let result;
    switch (action.verb) {
      case 'get':
        result = await this.handleGetAction(action);
        break;
      case 'render':
        result = await this.handleRenderAction(action);
        break;
      case 'show':
        result = await this.handleShowAction(action);
        break;
      case 'post':
        result = await this.handlePostAction(action, item, extension);
        break;
      default:
        break;
    }

    action.lastExecuted = new Date();
    action.running = false;
    return result;
  }

  async decryptResponse(response, keys) {
    const responseItem = response.item;
    await protocolManager.decryptItem(responseItem, keys);
    if (!responseItem.errorDecrypting) {
      return {
        response: response,
        item: responseItem
      };
    }

    if (!response.auth_params) {
      /**
       * In some cases revisions were missing auth params. 
       * Instruct the user to email us to get this remedied. 
       */
      this.alertManager.alert({
        text: `We were unable to decrypt this revision using your current keys, 
            and this revision is missing metadata that would allow us to try different 
            keys to decrypt it. This can likely be fixed with some manual intervention. 
            Please email hello@standardnotes.org for assistance.`
      });
      return {};
    }

    /* Try previous passwords */
    const triedPasswords = [];
    for (const passwordCandidate of this.previousPasswords) {
      if (triedPasswords.includes(passwordCandidate)) {
        continue;
      }
      triedPasswords.push(passwordCandidate);
      const keyResults = await protocolManager.computeEncryptionKeysForUser(
        passwordCandidate,
        response.auth_params
      );
      if (!keyResults) {
        continue;
      }
      const nestedResponse = await this.decryptResponse(
        response,
        keyResults
      );
      if (nestedResponse.item) {
        return nestedResponse;
      }
    }
    return new Promise((resolve, reject) => {
      this.presentPasswordModal((password) => {
        this.previousPasswords.push(password);
        const result = this.decryptResponse(response, keys);
        resolve(result);
      });
    })
  }

  async handlePostAction(action, item, extension) {
    const decrypted = action.access_type === 'decrypted';
    const itemParams = await this.outgoingParamsForItem(item, extension, decrypted);
    const params = {
      items: [itemParams]
    };
    /* Needed until SNJS detects null function */
    const emptyFunc = () => { };
    return this.httpManager.postAbsolute(
      action.url, 
      params, 
      emptyFunc,
      emptyFunc
    ).then((response) => {
      action.error = false;
      return {response: response};
    }).catch((response) => {
      action.error = true;
      console.error("Action error response:", response);
      this.alertManager.alert({
        text: "An issue occurred while processing this action. Please try again."
      });
      return { response: response };
    })
  }

  async handleShowAction(action) {
    const win = window.open(action.url, '_blank');
    if (win) {
      win.focus();
    }
    return { response: null };
  }

  async handleGetAction(action) {
  /* Needed until SNJS detects null function */
    const emptyFunc = () => {};
    const onConfirm = async () => {
      return this.httpManager.getAbsolute(action.url, {}, emptyFunc, emptyFunc)
      .then(async (response) => {
        action.error = false;
        await this.decryptResponse(response, await this.authManager.keys());
        const items = await this.modelManager.mapResponseItemsToLocalModels(
          [response.item],
          SFModelManager.MappingSourceRemoteActionRetrieved
        );
        for (const mappedItem of items) {
          this.modelManager.setItemDirty(mappedItem, true);
        }
        this.syncManager.sync();
        return { 
          response: response,
          item: response.item
        };
      }).catch((response) => {
        const error = (response && response.error)
          || { message: "An issue occurred while processing this action. Please try again." }
        this.alertManager.alert({ text: error.message });
        action.error = true;
        return { error: error };
      })
    }
    return new Promise((resolve, reject) => {
      this.alertManager.confirm({
        text: "Are you sure you want to replace the current note contents with this action's results?",
        onConfirm: () => {
          onConfirm().then(resolve)
        }
      })
    })
  }

  async handleRenderAction(action) {
    /* Needed until SNJS detects null function */
    const emptyFunc = () => {};
    return this.httpManager.getAbsolute(
      action.url, 
      {}, 
      emptyFunc,
      emptyFunc
    ).then(async (response) => {
      action.error = false;
      const result = await this.decryptResponse(response, await this.authManager.keys());
      const item = this.modelManager.createItem(result.item);
      return {
        response: result.response,
        item: item
      };
    }).catch((response) => {
      const error = (response && response.error)
        || { message: "An issue occurred while processing this action. Please try again." }
      this.alertManager.alert({ text: error.message });
      action.error = true;
      return { error: error };
    })
  }

  async outgoingParamsForItem(item, extension, decrypted = false) {
    let keys = await this.authManager.keys();
    if (decrypted) {
      keys = null;
    }
    const itemParams = new SFItemParams(
      item, 
      keys, 
      await this.authManager.getAuthParams()
    );
    return itemParams.paramsForExtension();
  }

  presentRevisionPreviewModal(uuid, content) {
    const scope = this.$rootScope.$new(true);
    scope.uuid = uuid;
    scope.content = content;
    const el = this.$compile(
      `<revision-preview-modal uuid='uuid' content='content' 
      class='sk-modal'></revision-preview-modal>`
    )(scope);
    angular.element(document.body).append(el);
  }

  presentPasswordModal(callback) {
    const scope = this.$rootScope.$new(true);
    scope.type = "password";
    scope.title = "Decryption Assistance";
    scope.message = `Unable to decrypt this item with your current keys. 
                     Please enter your account password at the time of this revision.`;
    scope.callback = callback;
    const el = this.$compile(
      `<input-modal type='type' message='message' 
     title='title' callback='callback'></input-modal>`
    )(scope);
    angular.element(document.body).append(el);
  }
}
