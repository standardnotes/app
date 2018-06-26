class DBManager {

  constructor() {
    this.locked = true;
  }

  displayOfflineAlert() {
    var message = "There was an issue loading your offline database. This could happen for two reasons:";
    message += "\n\n1. You're in a private window in your browser. We can't save your data without access to the local database. Please use a non-private window.";
    message += "\n\n2. You have two windows of the app open at the same time. Please close any other app instances and reload the page.";
    alert(message);
  }

  setLocked(locked) {
    this.locked = locked;
  }

  openDatabase(callback, onUgradeNeeded) {
    if(this.locked) {
      return;
    }

    var request = window.indexedDB.open("standardnotes", 1);

    request.onerror = function(event) {
      if(event.target.errorCode) {
        alert("Offline database issue: " + event.target.errorCode);
      } else {
        this.displayOfflineAlert();
      }
      console.error("Offline database issue:", event);
      if(callback) {
        callback(null);
      }
    }.bind(this);

    request.onsuccess = (event) => {
      var db = event.target.result;
      db.onversionchange = function(event) {
        db.close();
      };
      db.onerror = function(errorEvent) {
        console.log("Database error: " + errorEvent.target.errorCode);
      }
      if(callback) {
        callback(db);
      }
    };

    request.onupgradeneeded = (event) => {
      var db = event.target.result;

      db.onversionchange = function(event) {
        db.close();
      };

      // Create an objectStore for this database
      var objectStore = db.createObjectStore("items", { keyPath: "uuid" });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("uuid", "uuid", { unique: true });
      objectStore.transaction.oncomplete = function(event) {
        // Ready to store values in the newly created objectStore.
        if(db.version === 1) {
          if(onUgradeNeeded) {
            onUgradeNeeded();
          }
        }
      };
    };
  }

  getAllModels(callback) {
    this.openDatabase((db) => {
      var objectStore = db.transaction("items").objectStore("items");
      var items = [];
      objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
        }
        else {
          callback(items);
        }
      };
    }, null)
  }

  saveModel(item) {
    this.saveModels([item]);
  }

  saveModels(items, onsuccess, onerror) {

    if(items.length == 0) {
      if(onsuccess) {
        onsuccess();
      }
      return;
    }

    this.openDatabase((db) => {
      var transaction = db.transaction("items", "readwrite");
      transaction.oncomplete = function(event) {

      };

      transaction.onerror = function(event) {
        console.log("Transaction error:", event.target.errorCode);
      };

      transaction.onabort = function(event) {
        console.log("Offline saving aborted:", event);
        var error = event.target.error;
        if(error.name == "QuotaExceededError") {
          alert("Unable to save changes locally because your device is out of space. Please free up some disk space and try again, otherwise, your data may end up in an inconsistent state.");
        } else {
          alert(`Unable to save changes locally due to an unknown system issue. Issue Code: ${error.code} Issue Name: ${error.name}.`);
        }
        onerror && onerror(error);
      };

      var itemObjectStore = transaction.objectStore("items");
      var i = 0;
      putNext();

      function putNext() {
        if (i < items.length) {
          var item = items[i];
          itemObjectStore.put(item).onsuccess = putNext;
          ++i;
        } else {
          if(onsuccess){
            onsuccess();
          }
        }
      }
    }, null)
  }

  deleteModel(item, callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readwrite").objectStore("items").delete(item.uuid);
      request.onsuccess = function(event) {
        if(callback) {
          callback(true);
        }
      };
    }, null)
  }

  clearAllModels(callback) {
    var deleteRequest = window.indexedDB.deleteDatabase("standardnotes");

    deleteRequest.onerror = function(event) {
      console.log("Error deleting database.");
      callback && callback();
    };

    deleteRequest.onsuccess = function(event) {
      console.log("Database deleted successfully");
      callback && callback();
    };

    deleteRequest.onblocked = function(event) {
      console.error("Delete request blocked");
      alert("Your browser is blocking Standard Notes from deleting the local database. Make sure there are no other open windows of this app and try again. If the issue persists, please manually delete app data to sign out.")
    };
  }
}

angular.module('app').service('dbManager', DBManager);
