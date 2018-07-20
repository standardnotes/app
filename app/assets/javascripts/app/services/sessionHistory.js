class SessionHistory {

  constructor(modelManager, storageManager, authManager, passcodeManager, $timeout) {
    this.modelManager = modelManager;
    this.storageManager = storageManager;
    this.authManager = authManager;
    this.passcodeManager = passcodeManager;
    this.$timeout = $timeout;

    this.loadFromDisk().then(() => {
      this.modelManager.addItemSyncObserver("session-history", "Note", (allItems, validItems, deletedItems, source, sourceKey) => {
        for(let item of allItems) {
          this.addRevision(item);
        }
      });
    })
  }

  async encryptionParams() {
    let offline = this.authManager.offline();
    let auth_params = offline ? this.passcodeManager.passcodeAuthParams() : await this.authManager.getAuthParams();
    let keys = offline ? this.passcodeManager.keys() : await this.authManager.keys();
    return {keys, auth_params};
  }

  addRevision(item) {
    var added = this.historyContainer.addRevision(item);

    if(added) {
      if(this.diskTimeout) {this.$timeout.cancel(this.diskTimeout)};
      this.diskTimeout = this.$timeout(() => {
        this.saveToDisk();
      }, 1000)
    }
  }

  historyForItem(item) {
    return this.historyContainer.historyForItem(item);
  }

  async clearItemHistory(item) {
    delete this.historyContainer.clearItemHistory(item);
    return this.saveToDisk();
  }

  async clearAllHistory() {
    this.historyContainer.clearAllHistory();
    return this.storageManager.removeItem("sessionHistory");
  }

  async toggleDiskSaving() {
    this.diskEnabled = !this.diskEnabled;

    if(this.diskEnabled) {
      this.storageManager.setItem("persistSessionHistory", JSON.stringify(true));
      this.saveToDisk();
    } else {
      this.storageManager.removeItem("persistSessionHistory");
    }
  }

  async saveToDisk() {
    if(!this.diskEnabled) {
      return;
    }
    let encryptionParams = await this.encryptionParams();
    var itemParams = new SFItemParams(this.historyContainer, encryptionParams.keys, encryptionParams.auth_params);
    itemParams.paramsForSync().then((syncParams) => {
      console.log("Saving to disk", syncParams);
      this.storageManager.setItem("sessionHistory", JSON.stringify(syncParams));
    })
  }

  async loadFromDisk() {
    var diskValue = await this.storageManager.getItem("persistSessionHistory");
    if(diskValue) {
      this.diskEnabled = JSON.parse(diskValue);
    }

    var historyValue = await this.storageManager.getItem("sessionHistory");
    if(historyValue) {
      historyValue = JSON.parse(historyValue);
      let encryptionParams = await this.encryptionParams();
      await SFJS.itemTransformer.decryptItem(historyValue, encryptionParams.keys);
      var historyContainer = new HistoryContainer(historyValue);
      this.historyContainer = historyContainer;
    } else {
      this.historyContainer = new HistoryContainer();
    }
  }
}

class HistoryContainer extends SFItem {
  constructor(json_obj) {
    super(json_obj);

    if(!this.content.itemsDictionary) {
      this.content.itemsDictionary = {};
    }

    var objectKeys = Object.keys(this.content.itemsDictionary);
    objectKeys.forEach((key) => {
      var value = this.content.itemsDictionary[key];
      this.content.itemsDictionary[key] = new ItemHistory(value);
    });
  }

  addRevision(item) {
    if(!this.content.itemsDictionary[item.uuid]) {
      this.content.itemsDictionary[item.uuid] = new ItemHistory();
    }
    var itemHistory = this.content.itemsDictionary[item.uuid];
    return itemHistory.addRevision(item);
  }

  historyForItem(item) {
    return this.content.itemsDictionary[item.uuid];
  }

  clearItemHistory(item) {
    delete this.content.itemsDictionary[item.uuid];
  }

  clearAllHistory() {
    this.content.itemsDictionary = {};
  }
}

class ItemHistory {

  constructor(json_obj = {}) {
    if(!this.revisions) {
      this.revisions = [];
    }
    if(json_obj.revisions) {
      for(var revision of json_obj.revisions) {
        this.revisions.push(new NoteRevision(revision, this.revisions[this.revisions.length - 1], revision.date));
      }
    }
  }

  addRevision(item) {
    var previousRevision = this.revisions[this.revisions.length - 1];
    var prospectiveRevision = new NoteRevision(item, previousRevision, item.updated_at);
    if(prospectiveRevision.isSameAsRevision(previousRevision)) {
      return;
    }
    this.revisions.push(prospectiveRevision);
    return prospectiveRevision;
  }

}

class ItemRevision {

  constructor(item, previousRevision, date) {
    if(typeof(date) == "string") {
      this.date = new Date(date);
    } else {
      this.date = date;
    }
    this.itemUuid = item.uuid;
    this.hasPreviousRevision = previousRevision != null;
    this.content = Object.assign({}, item.content);
  }

  isSameAsRevision(revision) {
    if(!revision) {
      return false;
    }
    return JSON.stringify(this.content) === JSON.stringify(revision.content);
  }

}

class NoteRevision extends ItemRevision {
  constructor(item, previousRevision, date) {
    super(item, previousRevision, date);
    if(previousRevision) {
      this.textCharDiffLength = this.content.text.length - previousRevision.content.text.length;
    } else {
      this.textCharDiffLength = this.content.text.length;
    }
  }

  previewTitle() {
    return this.date.toLocaleString();
  }

  operationVector() {
    if(!this.hasPreviousRevision || this.textCharDiffLength == 0) {
      return 0;
    } else if(this.textCharDiffLength < 0) {
      return -1;
    } else {
      return 1;
    }
  }

  previewSubTitle() {
    if(!this.hasPreviousRevision) {
      return `${this.textCharDiffLength} characters loaded`
    } else if(this.textCharDiffLength < 0) {
      return `${this.textCharDiffLength * -1} characters removed`
    } else if(this.textCharDiffLength > 0) {
      return `${this.textCharDiffLength} characters added`
    } else {
      return "Title changed"
    }
  }
}

angular.module('app').service('sessionHistory', SessionHistory);
