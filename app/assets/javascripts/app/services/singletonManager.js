/*
  The SingletonManager allows controllers to register an item as a singleton, which means only one instance of that model
  should exist, both on the server and on the client. When the SingletonManager detects multiple items matching the singleton predicate,
  the oldest ones will be deleted, leaving the newest ones. (See 4/28/18 update. We now choose the earliest created one as the winner.).

  (This no longer fully applies, See 4/28/18 update.) We will treat the model most recently arrived from the server as the most recent one. The reason for this is,
  if you're offline, a singleton can be created, as in the case of UserPreferneces. Then when you sign in, you'll retrieve your actual user preferences.
  In that case, even though the offline singleton has a more recent updated_at, the server retreived value is the one we care more about.

  4/28/18: I'm seeing this issue: if you have the app open in one window, then in another window sign in, and during sign in,
  click Refresh (or autorefresh occurs) in the original signed in window, then you will happen to receive from the server the newly created
  Extensions singleton, and it will be mistaken (it just looks like a regular retrieved item, since nothing is in saved) for a fresh, latest copy, and replace the current instance.
  This has happened to me and many users.
  A puzzling issue, but what if instead of resolving singletons by choosing the one most recently modified, we choose the one with the earliest create date?
  This way, we don't care when it was modified, but we always, always choose the item that was created first. This way, we always deal with the same item.
*/

class SingletonManager {

  constructor($rootScope, modelManager) {
    this.$rootScope = $rootScope;
    this.modelManager = modelManager;
    this.singletonHandlers = [];

    $rootScope.$on("initial-data-loaded", (event, data) => {
      this.resolveSingletons(modelManager.allItems, null, true);
      this.initialDataLoaded = true;
    })

    /*
      If an item alternates its uuid on registration, singletonHandlers might need to update
      their local refernece to the object, since the object reference will change on uuid alternation
    */
    modelManager.addModelUuidChangeObserver("singleton-manager", (oldModel, newModel) => {
      for(var handler of this.singletonHandlers) {
        if(handler.singleton && SFPredicate.ItemSatisfiesPredicates(newModel, handler.predicates)) {
          // Reference is now invalid, calling resolveSingleton should update it
          handler.singleton = null;
          this.resolveSingletons([newModel]);
        }
      }
    })

    $rootScope.$on("sync:completed", (event, data) => {
      // Wait for initial data load before handling any sync. If we don't want for initial data load,
      // then the singleton resolver won't have the proper items to work with to determine whether to resolve or create.
      if(!this.initialDataLoaded) {
        return;
      }
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

  registerSingleton(predicates, resolveCallback, createBlock) {
    /*
    predicate: a key/value pair that specifies properties that should match in order for an item to be considered a predicate
    resolveCallback: called when one or more items are deleted and a new item becomes the reigning singleton
    createBlock: called when a sync is complete and no items are found. The createBlock should create the item and return it.
    */
    this.singletonHandlers.push({
      predicates: predicates,
      resolutionCallback: resolveCallback,
      createBlock: createBlock
    });
  }

  resolveSingletons(retrievedItems, savedItems, initialLoad) {
    retrievedItems = retrievedItems || [];
    savedItems = savedItems || [];

    for(let singletonHandler of this.singletonHandlers) {
      var predicates = singletonHandler.predicates;
      let retrievedSingletonItems = this.modelManager.filterItemsWithPredicates(retrievedItems, predicates);

      // We only want to consider saved items count to see if it's more than 0, and do nothing else with it.
      // This way we know there was some action and things need to be resolved. The saved items will come up
      // in filterItemsWithPredicate(this.modelManager.allItems) and be deleted anyway
      let savedSingletonItemsCount = this.modelManager.filterItemsWithPredicates(savedItems, predicates).length;

      if(retrievedSingletonItems.length > 0 || savedSingletonItemsCount > 0) {
        /*
          Check local inventory and make sure only 1 similar item exists. If more than 1, delete newest
          Note that this local inventory will also contain whatever is in retrievedItems.
        */
        var allExtantItemsMatchingPredicate = this.modelManager.itemsMatchingPredicates(predicates);

        /*
          Delete all but the earliest created
        */
        if(allExtantItemsMatchingPredicate.length >= 2) {
          let sorted = allExtantItemsMatchingPredicate.sort((a, b) => {
            /*
              If compareFunction(a, b) is less than 0, sort a to an index lower than b, i.e. a comes first.
              If compareFunction(a, b) is greater than 0, sort b to an index lower than a, i.e. b comes first.
            */
            return a.created_at < b.created_at ? -1 : 1;
          });

          // The item that will be chosen to be kept
          let winningItem = sorted[0];

          // Items that will be deleted
          // Delete everything but the first one
          let toDelete = sorted.slice(1, sorted.length);

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
}

angular.module('app').service('singletonManager', SingletonManager);
