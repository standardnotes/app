const SessionHistoryPersistKey = "sessionHistory_persist";
const SessionHistoryRevisionsKey = "sessionHistory_revisions";
const SessionHistoryAutoOptimizeKey = "sessionHistory_autoOptimize";

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
    return this.storageManager.removeItem(SessionHistoryRevisionsKey);
  }

  async toggleDiskSaving() {
    this.diskEnabled = !this.diskEnabled;

    if(this.diskEnabled) {
      this.storageManager.setItem(SessionHistoryPersistKey, JSON.stringify(true));
      this.saveToDisk();
    } else {
      this.storageManager.setItem(SessionHistoryPersistKey, JSON.stringify(false));
      return this.storageManager.removeItem(SessionHistoryRevisionsKey);
    }
  }

  get autoOptimize() {
    return this.historyContainer.autoOptimize;
  }

  async toggleAutoOptimize() {
    this.historyContainer.autoOptimize = !this.historyContainer.autoOptimize;

    if(this.historyContainer.autoOptimize) {
      this.storageManager.setItem(SessionHistoryAutoOptimizeKey, JSON.stringify(true));
    } else {
      this.storageManager.setItem(SessionHistoryAutoOptimizeKey, JSON.stringify(false));
    }
  }

  async saveToDisk() {
    if(!this.diskEnabled) {
      return;
    }
    let encryptionParams = await this.encryptionParams();
    var itemParams = new SFItemParams(this.historyContainer, encryptionParams.keys, encryptionParams.auth_params);
    itemParams.paramsForSync().then((syncParams) => {
      // console.log("Saving to disk", syncParams);
      this.storageManager.setItem(SessionHistoryRevisionsKey, JSON.stringify(syncParams));
    })
  }

  async loadFromDisk() {
    var diskValue = await this.storageManager.getItem(SessionHistoryPersistKey);
    if(diskValue) {
      this.diskEnabled = JSON.parse(diskValue);
    }

    var historyValue = await this.storageManager.getItem(SessionHistoryRevisionsKey);
    if(historyValue) {
      historyValue = JSON.parse(historyValue);
      let encryptionParams = await this.encryptionParams();
      await SFJS.itemTransformer.decryptItem(historyValue, encryptionParams.keys);
      var historyContainer = new HistoryContainer(historyValue);
      this.historyContainer = historyContainer;
    } else {
      this.historyContainer = new HistoryContainer();
    }

    var autoOptimizeValue = await this.storageManager.getItem(SessionHistoryAutoOptimizeKey);
    if(autoOptimizeValue) {
      this.historyContainer.autoOptimize = JSON.parse(autoOptimizeValue);
    } else {
      // default value is true
      this.historyContainer.autoOptimize = true;
    }
  }

  async optimize() {
    return this.historyContainer.optimize();
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
    return itemHistory.addRevision(item, this.autoOptimize);
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

  optimize() {
    var objectKeys = Object.keys(this.content.itemsDictionary);
    objectKeys.forEach((key) => {
      var itemHistory = this.content.itemsDictionary[key];
      itemHistory.optimize();
    });
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

  addRevision(item, autoOptimize) {
    var previousRevision = this.revisions[this.revisions.length - 1];
    var prospectiveRevision = new NoteRevision(item, previousRevision, item.updated_at);

    // Don't add first revision if text length is 0, as this means it's a new note.
    // Actually, we'll skip this. If we do this, the first character added to a new note
    // will be displayed as "1 characters loaded"
    // if(!previousRevision && prospectiveRevision.textCharDiffLength == 0) {
    //   return;
    // }

    // Don't add if text is the same
    if(prospectiveRevision.isSameAsRevision(previousRevision)) {
      return;
    }

    this.revisions.push(prospectiveRevision);

    // Clean up if there are too many revisions
    const LargeRevisionAmount = 100;
    if(autoOptimize && this.revisions.length > LargeRevisionAmount) {
      this.optimize();
    }

    return prospectiveRevision;
  }

  optimize() {
    const SmallRevisionLength = 15;
    this.revisions = this.revisions.filter((revision, index) => {
      // Keep only first and last item and items whos diff length is greater than the small revision length.
      var isFirst = index == 0;
      var isLast = index == this.revisions.length - 1;
      var isSmallRevision = Math.abs(revision.textCharDiffLength) < SmallRevisionLength;
      return isFirst || isLast || !isSmallRevision;
    })
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
