export class DBManager {
  /* @ngInject */
  constructor(alertManager) {
    this.locked = true;
    this.alertManager = alertManager;
  }

  displayOfflineAlert() {
    var message = "There was an issue loading your offline database. This could happen for two reasons:";
    message += "\n\n1. You're in a private window in your browser. We can't save your data without access to the local database. Please use a non-private window.";
    message += "\n\n2. You have two windows of the app open at the same time. Please close any other app instances and reload the page.";
    this.alertManager.alert({text: message});
  }

  setLocked(locked) {
    this.locked = locked;
  }

  async openDatabase({onUpgradeNeeded} = {}) {
    if(this.locked) {
      return;
    }

    const request = window.indexedDB.open("standardnotes", 1);

    return new Promise((resolve, reject) => {
      request.onerror = (event) => {
        if(event.target.errorCode) {
          this.alertManager.alert({text: "Offline database issue: " + event.target.errorCode});
        } else {
          this.displayOfflineAlert();
        }
        console.error("Offline database issue:", event);
        resolve(null);
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        db.onversionchange = function(event) {
          db.close();
        };
        db.onerror = function(errorEvent) {
          console.error("Database error: " + errorEvent.target.errorCode);
        };
        resolve(db);
      };

      request.onblocked = (event) => {
        console.error("Request blocked error:", event.target.errorCode);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        db.onversionchange = function(event) {
          db.close();
        };

        // Create an objectStore for this database
        const objectStore = db.createObjectStore("items", { keyPath: "uuid" });
        objectStore.createIndex("uuid", "uuid", { unique: true });
        objectStore.transaction.oncomplete = function(event) {
          // Ready to store values in the newly created objectStore.
          if(db.version === 1 && onUpgradeNeeded) {
            onUpgradeNeeded();
          }
        };
      };
    });
  }

  async getAllModels() {
    const db = await this.openDatabase();
    const objectStore = db.transaction("items").objectStore("items");
    const items = [];
    return new Promise(async (resolve, reject) => {
      objectStore.openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        } else {
          resolve(items);
        }
      };
    });
  }

  async saveModel(item) {
    this.saveModels([item]);
  }

  async saveModels(items) {
    const showGenericError = (error) => {
      this.alertManager.alert({text: `Unable to save changes locally due to an unknown system issue. Issue Code: ${error.code} Issue Name: ${error.name}.`});
    };

    return new Promise(async (resolve, reject) => {
      if(items.length === 0) {
        resolve();
        return;
      }

      const db = await this.openDatabase();
      const transaction = db.transaction("items", "readwrite");
      transaction.oncomplete = (event) => {};
      transaction.onerror = function(event) {
        console.error("Transaction error:", event.target.errorCode);
        showGenericError(event.target.error);
      };
      transaction.onblocked = function(event) {
        console.error("Transaction blocked error:", event.target.errorCode);
        showGenericError(event.target.error);
      };
      transaction.onabort = function(event) {
        console.error("Offline saving aborted:", event);
        const error = event.target.error;
        if(error.name == "QuotaExceededError") {
          this.alertManager.alert({text: "Unable to save changes locally because your device is out of space. Please free up some disk space and try again, otherwise, your data may end up in an inconsistent state."});
        } else {
          showGenericError(error);
        }
        reject(error);
      };

      const itemObjectStore = transaction.objectStore("items");

      const putItem = async (item) => {
        return new Promise((resolve, reject) => {
          const request = itemObjectStore.put(item);
          request.onerror = (event) => {
            console.error("DB put error:", event.target.error);
            resolve();
          };
          request.onsuccess = resolve;
        });
      };

      for(const item of items) {
        await putItem(item);
      }

      resolve();
    });
  }

  async deleteModel(item) {
    return new Promise(async (resolve, reject) => {
      const db = await this.openDatabase();
      const request = db.transaction("items", "readwrite").objectStore("items").delete(item.uuid);
      request.onsuccess = (event) => {
        resolve();
      };
      request.onerror = (event) => {
        reject();
      };
    });
  }

  async clearAllModels() {
    const deleteRequest = window.indexedDB.deleteDatabase("standardnotes");

    return new Promise((resolve, reject) => {
      deleteRequest.onerror = function(event) {
        console.error("Error deleting database.");
        resolve();
      };

      deleteRequest.onsuccess = function(event) {
        resolve();
      };

      deleteRequest.onblocked = function(event) {
        console.error("Delete request blocked");
        this.alertManager.alert({text: "Your browser is blocking Standard Notes from deleting the local database. Make sure there are no other open windows of this app and try again. If the issue persists, please manually delete app data to sign out."});
        resolve();
      };
    });
  }
}
