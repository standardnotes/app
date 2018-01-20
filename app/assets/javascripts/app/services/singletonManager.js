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
      this.resolveSingletons(modelManager.allItems, null, true);
    })

    $rootScope.$on("sync:completed", (event, data) => {
      // The reason we also need to consider savedItems in consolidating singletons is in case of sync conflicts,
      // a new item can be created, but is never processed through "retrievedItems" since it is only created locally then saved.

      // HOWEVER, by considering savedItems, we are now ruining everything, especially during sign in. A singleton can be created
      // offline, and upon sign in, will sync all items to the server, and by combining retrievedItems & savedItems, and only choosing
      // the latest, you are now resolving to the most recent one, which is in the savedItems list and not retrieved items, defeating
      // the whole purpose of this thing.

      // Updated solution: resolveSingletons will now evaluate both of these arrays separately.
      this.resolveSingletons(data.retrievedItems, data.savedItems);
    })
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

  resolveSingletons(retrievedItems, savedItems, initialLoad) {
    retrievedItems = retrievedItems || [];
    savedItems = savedItems || [];

    for(let singletonHandler of this.singletonHandlers) {
      var predicate = singletonHandler.predicate;
      let retrievedSingletonItems = this.filterItemsWithPredicate(retrievedItems, predicate);

      // We only want to consider saved items count to see if it's more than 0, and do nothing else with it.
      // This way we know there was some action and things need to be resolved. The saved items will come up
      // in filterItemsWithPredicate(this.modelManager.allItems) and be deleted anyway
      let savedSingletonItemsCount = this.filterItemsWithPredicate(savedItems, predicate).length;
      if(retrievedSingletonItems.length > 0 || savedSingletonItemsCount > 0) {
        /*
          Check local inventory and make sure only 1 similar item exists. If more than 1, delete oldest
          Note that this local inventory will also contain whatever is in retrievedItems.
          However, as stated in the header comment, retrievedItems take precendence over existing items,
          even if they have a lower updated_at value
        */
        var allExtantItemsMatchingPredicate = this.filterItemsWithPredicate(this.modelManager.allItems, predicate);

        /*
          If there are more than 1 matches, delete everything not in `retrievedSingletonItems`,
          then delete all but the latest in `retrievedSingletonItems`
        */
        if(allExtantItemsMatchingPredicate.length >= 2) {

          // Items that will be deleted
          var toDelete = [];
          // The item that will be chosen to be kept
          var winningItem, sorted;

          if(retrievedSingletonItems.length > 0) {
            for(let extantItem of allExtantItemsMatchingPredicate) {
              if(!retrievedSingletonItems.includes(extantItem)) {
                // Delete it
                toDelete.push(extantItem);
              }
            }

            // Sort incoming singleton items by most recently updated first, then delete all the rest
            sorted = retrievedSingletonItems.sort((a, b) => {
              return a.updated_at < b.updated_at;
            })

          } else {
            // We're in here because of savedItems
            // This can be the case if retrievedSingletonItems/retrievedItems length is 0, but savedSingletonItemsCount is non zero.
            // In this case, we want to sort by date and delete all but the most recent one
            sorted = allExtantItemsMatchingPredicate.sort((a, b) => {
              return a.updated_at < b.updated_at;
            });
          }

          winningItem = sorted[0];

          // Delete everything but the first one
          toDelete = toDelete.concat(sorted.slice(1, sorted.length));

          for(var d of toDelete) {
            this.modelManager.setItemToBeDeleted(d);
          }

          this.$rootScope.sync();

          // Send remaining item to callback
          singletonHandler.singleton = winningItem;
          singletonHandler.resolutionCallback(winningItem);

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
        if(!candidateValue) {
          // predicateValue is 'object' but candidateValue is null
          return false;
        }

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

angular.module('app').service('singletonManager', SingletonManager);
