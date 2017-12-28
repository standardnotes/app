/*
  The SingletonManager allows controllers to register an item as a singleton, which means only one instance of that model
  should exist, both on the server and on the client. When the SingletonManager detects multiple items matching the singleton predicate,
  the oldest ones will be deleted, leaving the newest ones.

  We will treat the model most recently arrived from the server as the most recent one. The reason for this is, if you're offline,
  a singleton can be created, as in the case of UserPreferneces. Then when you sign in, you'll retrieve your actual user preferences.
  In that case, even though the offline singleton has a more recent updated_at, the server retreived value is the one we care more about.
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
      this.resolveSingletons(data.retrievedItems || []);
    })

    // Testing code to make sure only 1 exists
    setTimeout(function () {
      var userPrefs = modelManager.itemsForContentType("SN|UserPreferences");
      console.assert(userPrefs.length == 1);
      console.log("All extant prefs", userPrefs);
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
    for(let singletonHandler of this.singletonHandlers) {
      var predicate = singletonHandler.predicate;
      var singletonItems = this.filterItemsWithPredicate(retrievedItems, predicate);
      if(singletonItems.length > 0) {
        /*
          Check local inventory and make sure only 1 similar item exists. If more than 1, delete oldest
          Note that this local inventory will also contain whatever is in retrievedItems.
          However, as stated in the header comment, retrievedItems take precendence over existing items,
          even if they have a lower updated_at value
        */
        var allExtantItemsMatchingPredicate = this.filterItemsWithPredicate(this.modelManager.allItems, predicate);

        /*
          If there are more than 1 matches, delete everything not in `singletonItems`,
          then delete all but the latest in `singletonItems`
        */
        if(allExtantItemsMatchingPredicate.length >= 2) {
          var toDelete = [];
          for(let extantItem of allExtantItemsMatchingPredicate) {
            if(!singletonItems.includes(extantItem)) {
              // Delete it
              toDelete.push(extantItem);
            }
          }

          // Sort incoming singleton items by most recently updated first, then delete all the rest
          var sorted = singletonItems.sort((a, b) => {
            return a.updated_at < b.updated_at;
          })

          // Delete everything but the first one
          toDelete = toDelete.concat(sorted.slice(1, sorted.length));

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
        if(!singletonHandler.singleton && !initialLoad && !singletonHandler.pendingCreateBlockCallback) {
          singletonHandler.pendingCreateBlockCallback = true;
          singletonHandler.createBlock((created) => {
            singletonHandler.singleton = created;
            singletonHandler.pendingCreateBlockCallback = false;
            singletonHandler.resolutionCallback(created);
          });
        }
      }
    }
  }

  filterItemsWithPredicate(items, predicate) {
    return items.filter((candidate) => {
      return this.itemSatisfiesPredicate(candidate, predicate);
    })
  }

  itemSatisfiesPredicate(candidate, predicate) {
    for(var key in predicate) {
      var predicateValue = predicate[key];
      var candidateValue = candidate[key];
      if(typeof predicateValue == 'object') {
        // Check nested properties
        if(!this.itemSatisfiesPredicate(candidateValue, predicateValue)) {
          return false;
        }
      }
      else if(candidateValue != predicateValue) {
        return false;
      }
    }
    return true;
  }

}

angular.module('app.frontend').service('singletonManager', SingletonManager);
