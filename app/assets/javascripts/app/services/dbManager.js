class DBManager {

  openDatabase(callback, onUgradeNeeded) {
    var request = window.indexedDB.open("standardnotes", 1);

    request.onerror = function(event) {
      alert("Please enable permissions for Standard Notes to use IndexedDB for offline mode.");
      if(callback) {
        callback(null);
      }
    };

    request.onsuccess = (event) => {
      // console.log("Successfully opened database", event.target.result);
       var db = event.target.result;
       db.onerror = function(errorEvent) {
         console.log("Database error: " + errorEvent.target.errorCode);
       }
       if(callback) {
         callback(db);
       }
    };

    request.onupgradeneeded = (event) => {
      var db = event.target.result;
      if(db.version === 1) {
        if(onUgradeNeeded) {
          onUgradeNeeded();
        }
      }

      // Create an objectStore for this database
      var objectStore = db.createObjectStore("items", { keyPath: "uuid" });
      objectStore.createIndex("title", "title", { unique: false });
      objectStore.createIndex("uuid", "uuid", { unique: true });
      objectStore.transaction.oncomplete = function(event) {
        // Ready to store values in the newly created objectStore.
      };
    };
  }

  getAllItems(callback) {

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

  saveItem(item) {
    saveItems([item]);
  }

  saveItems(items, callback) {

    if(items.length == 0) {
      if(callback) {
        callback();
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

      var itemObjectStore = transaction.objectStore("items");
      var i = 0;
      putNext();

      function putNext() {
        if (i < items.length) {
          var item = items[i];
          itemObjectStore.put(item).onsuccess = putNext;
          ++i;
        } else {
          if(callback){
            callback();
          }
        }
      }
    }, null)
  }

  deleteItem(item) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readwrite").objectStore("items").delete(item.uuid);
      request.onsuccess = function(event) {
        console.log("Successfully deleted item", item.uuid);
      };
    }, null)
  }

  getItemByUUID(uuid, callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readonly").objectStore("items").get(uuid);
      request.onsuccess = function(event) {
        callback(event.result);
      };
    }, null);
  }

  clearAllItems(callback) {
    this.openDatabase((db) => {
      var request = db.transaction("items", "readwrite").objectStore("items").clear();
      request.onsuccess = function(event) {
        console.log("Successfully cleared items");
        callback();
      };
    }, null)
  }
}

angular.module('app.frontend').service('dbManager', DBManager);
