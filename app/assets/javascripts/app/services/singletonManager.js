/*
  The SingletonManager allows controllers to register an item as a singleton, which means only one instance of that model
  should exist, both on the server and on the client. When the SingletonManager detects multiple items matching the singleton predicate,
  the oldest ones will be deleted, leaving the newest ones
*/

class SingletonManager {

  constructor($rootScope, modelManager) {
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.singletonHandlers = [];

    $rootScope.$on("initial-data-loaded", (event, data) => {
      this.resolveSingletons(modelManager.allItems, true);
    })

    $rootScope.$on("sync:completed", (event, data) => {
      console.log("Sync completed", data);
      this.resolveSingletons(data.retrievedItems || []);
    })

    setTimeout(function () {
      var userPrefsTotal = modelManager.itemsForContentType("SN|UserPreferences");
      console.log("All extant prefs", userPrefsTotal);
    }, 1000);
  }

  registerSingleton(predicate, resolveCallback, createBlock) {
    /*
    predicate: a key/value pair that specifies properties that should match in order for an item to be considered a predicate
    resolveCallback: called when one or more items are deleted and a new item becomes the reigning singleton
    createBlock: called when a sync is complete and no items are found. The createBlock should create the item and return it.
    */
    this.singletonHandlers.push({
      predicate: predicate,
      resolutionCallback: resolveCallback,
      createBlock: createBlock
    });
  }

  resolveSingletons(retrievedItems, initialLoad) {
    for(var singletonHandler of this.singletonHandlers) {
      var predicate = singletonHandler.predicate;
      var singletonItems = this.filterItemsWithPredicate(retrievedItems, predicate);
      if(singletonItems.length > 0) {
        // Check local inventory and make sure only 1 similar item exists. If more than 1, delete oldest
        var allExtantItemsMatchingPredicate = this.filterItemsWithPredicate(this.modelManager.allItems, predicate);

        if(allExtantItemsMatchingPredicate.length >= 2) {
          // Purge old ones
          var sorted = allExtantItemsMatchingPredicate.sort((a, b) => {
            return a.updated_at < b.updated_at;
          })

          var toDelete = sorted.slice(1, sorted.length);
          for(var d of toDelete) {
            this.modelManager.setItemToBeDeleted(d);
          }

          this.$rootScope.sync();
          // Send remaining item to callback
          var singleton = sorted[0];
          singletonHandler.singleton = singleton;
          singletonHandler.resolutionCallback(singleton);
        } else if(allExtantItemsMatchingPredicate.length == 1) {
          if(!singletonHandler.singleton) {
            // Not yet notified interested parties of object
            var singleton = allExtantItemsMatchingPredicate[0];
            singletonHandler.singleton = singleton;
            singletonHandler.resolutionCallback(singleton);

          }
        }
      } else {
        // Retrieved items does not include any items of interest. If we don't have a singleton registered to this handler,
        // we need to create one. Only do this on actual sync completetions and not on initial data load. Because we want
        // to get the latest from the server before making the decision to create a new item
        if(!singletonHandler.singleton && !initialLoad) {
          var item = singletonHandler.createBlock();
          singletonHandler.singleton = item;
          singletonHandler.resolutionCallback(item);
        }
      }
    }
  }

  filterItemsWithPredicate(items, predicate) {
    return items.filter((candidate) => {
      for(var key in predicate) {
        if(candidate[key] != predicate[key]) {
          return false;
        }
      }
      return true;
    })
  }

}

angular.module('app.frontend').service('singletonManager', SingletonManager);
