angular.module('app')
  .directive("notesSection", function(){
    return {
      scope: {
        addNew: "&",
        selectionMade: "&",
        tag: "="
      },

      templateUrl: 'notes.html',
      replace: true,
      controller: 'NotesCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.tag', (tag, oldTag) => {
          if(tag) {
            ctrl.tagDidChange(tag, oldTag);
          }
        });
      }
    }
  })
  .controller('NotesCtrl', function (authManager, $timeout, $rootScope, modelManager,
    syncManager, storageManager, desktopManager, privilegesManager, keyboardManager) {

    this.panelController = {};
    this.searchSubmitted = false;

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
      this.reloadNotes();
    });

    authManager.addEventHandler((event) => {
      if(event == SFAuthManager.DidSignInEvent) {
        // Delete dummy note if applicable
        if(this.selectedNote && this.selectedNote.dummy) {
          modelManager.removeItemLocally(this.selectedNote);
          _.pull(this.notes, this.selectedNote);
          this.selectedNote = null;
        }
      }
    })

    syncManager.addEventHandler((syncEvent, data) => {
      if(syncEvent == "local-data-loaded") {
        this.localDataLoaded = true;
        this.needsHandleDataLoad = true;
      }
    });

    modelManager.addItemSyncObserver("note-list", "*", (allItems, validItems, deletedItems, source, sourceKey) => {
      // reload our notes
      this.reloadNotes();

      if(this.needsHandleDataLoad) {
        this.needsHandleDataLoad = false;
        if(this.tag && this.notes.length == 0) {
          this.createNewNote();
        }
      }

      // Note has changed values, reset its flags
      let notes = allItems.filter((item) => item.content_type == "Note");
      for(let note of notes) {
        this.loadFlagsForNote(note);
        note.cachedCreatedAtString = note.createdAtString();
        note.cachedUpdatedAtString = note.updatedAtString();
      }

      // select first note if none is selected
      if(!this.selectedNote) {
        $timeout(() => {
          // required to be in timeout since selecting notes depends on rendered notes
          this.selectFirstNote();
        })
      }
    });

    this.setNotes = function(notes) {
      notes = this.filterNotes(notes);
      notes = this.sortNotes(notes, this.sortBy, this.sortReverse);
      for(let note of notes) {
        note.shouldShowTags = this.shouldShowTagsForNote(note);
      }
      this.notes = notes;

      this.reloadPanelTitle();
    }

    this.reloadNotes = function() {
      let notes = this.tag.notes;

      // Typically we reload flags via modelManager.addItemSyncObserver,
      // but sync observers are not notified of errored items, so we'll do it here instead
      for(let note of notes) {
        if(note.errorDecrypting) {
          this.loadFlagsForNote(note);
        }
      }

      this.setNotes(notes);
    }

    this.reorderNotes = function() {
      this.setNotes(this.notes);
    }

    this.loadPreferences = function() {
      let prevSortValue = this.sortBy;

      this.sortBy = authManager.getUserPrefValue("sortBy", "created_at");
      this.sortReverse = authManager.getUserPrefValue("sortReverse", false);

      if(this.sortBy == "updated_at") {
        // use client_updated_at instead
        this.sortBy = "client_updated_at";
      }

      if(prevSortValue && prevSortValue != this.sortBy) {
        $timeout(() => {
          this.selectFirstNote();
        })
      }

      this.showArchived = authManager.getUserPrefValue("showArchived", false);
      this.hidePinned = authManager.getUserPrefValue("hidePinned", false);
      this.hideNotePreview = authManager.getUserPrefValue("hideNotePreview", false);
      this.hideDate = authManager.getUserPrefValue("hideDate", false);
      this.hideTags = authManager.getUserPrefValue("hideTags", false);

      let width = authManager.getUserPrefValue("notesPanelWidth");
      if(width) {
        this.panelController.setWidth(width);
        if(this.panelController.isCollapsed()) {
          $rootScope.$broadcast("panel-resized", {panel: "notes", collapsed: this.panelController.isCollapsed()})
        }
      }
    }

    this.loadPreferences();

    this.onPanelResize = function(newWidth, lastLeft, isAtMaxWidth, isCollapsed) {
      authManager.setUserPrefValue("notesPanelWidth", newWidth);
      authManager.syncUserPreferences();
      $rootScope.$broadcast("panel-resized", {panel: "notes", collapsed: isCollapsed})
    }

    angular.element(document).ready(() => {
      this.loadPreferences();
    });

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    $rootScope.$on("noteDeleted", function() {
      $timeout(this.onNoteRemoval.bind(this));
    }.bind(this))

    $rootScope.$on("noteArchived", function() {
      $timeout(this.onNoteRemoval.bind(this));
    }.bind(this));


    // When a note is removed from the list
    this.onNoteRemoval = function() {
      let visibleNotes = this.visibleNotes();
      let index;
      if(this.selectedIndex < visibleNotes.length) {
        index = Math.max(this.selectedIndex, 0);
      } else {
        index = visibleNotes.length - 1;
      }

      let note = visibleNotes[index];
      if(note) {
        this.selectNote(note);
      } else {
        this.createNewNote();
      }
    }

    window.onresize = (event) =>   {
      this.resetPagination({keepCurrentIfLarger: true});
    };

    this.paginate = function() {
      this.notesToDisplay += this.DefaultNotesToDisplayValue

      if (this.searchSubmitted) {
        desktopManager.searchText(this.noteFilter.text);
      }
    }

    this.resetPagination = function({keepCurrentIfLarger} = {}) {
      let MinNoteHeight = 51.0; // This is the height of a note cell with nothing but the title, which *is* a display option
      this.DefaultNotesToDisplayValue = (document.documentElement.clientHeight / MinNoteHeight) || 20;
      if(keepCurrentIfLarger && this.notesToDisplay > this.DefaultNotesToDisplayValue) {
        return;
      }
      this.notesToDisplay = this.DefaultNotesToDisplayValue;
    }

    this.resetPagination();

    this.reloadPanelTitle = function() {
      if(this.isFiltering()) {
        this.panelTitle = `${this.notes.filter((i) => {return i.visible;}).length} search results`;
      } else if(this.tag) {
        this.panelTitle = `${this.tag.title}`;
      }
    }

    this.optionsSubtitle = function() {
      var base = "";
      if(this.sortBy == "created_at") {
        base += " Date Added";
      } else if(this.sortBy == "client_updated_at") {
        base += " Date Modified";
      } else if(this.sortBy == "title") {
        base += " Title";
      }

      if(this.showArchived) {
        base += " | + Archived"
      }
      if(this.hidePinned) {
        base += " | – Pinned"
      }

      return base;
    }

    this.loadFlagsForNote = (note) => {
      let flags = [];

      if(note.pinned) {
        flags.push({
          text: "Pinned",
          class: "info"
        })
      }

      if(note.archived) {
        flags.push({
          text: "Archived",
          class: "warning"
        })
      }

      if(note.content.protected) {
        flags.push({
          text: "Protected",
          class: "success"
        })
      }

      if(note.locked) {
        flags.push({
          text: "Locked",
          class: "neutral"
        })
      }

      if(note.content.trashed) {
        flags.push({
          text: "Deleted",
          class: "danger"
        })
      }

      if(note.content.conflict_of) {
        flags.push({
          text: "Conflicted Copy",
          class: "danger"
        })
      }

      if(note.errorDecrypting) {
        flags.push({
          text: "Missing Keys",
          class: "danger"
        })
      }

      note.flags = flags;

      return flags;
    }

    this.tagDidChange = function(tag, oldTag) {
      var scrollable = document.getElementById("notes-scrollable");
      if(scrollable) {
        scrollable.scrollTop = 0;
        scrollable.scrollLeft = 0;
      }

      this.resetPagination();

      this.showMenu = false;

      if(this.selectedNote && this.selectedNote.dummy) {
        if(oldTag) {
          _.remove(oldTag.notes, this.selectedNote);
        }
      }

      this.noteFilter.text = "";

      this.setNotes(tag.notes);

      // perform in timeout since visibleNotes relies on renderedNotes which relies on render to complete
      $timeout(() => {
        if(this.notes.length > 0) {
          this.notes.forEach((note) => { note.visible = true; })
          this.selectFirstNote();
        } else if(this.localDataLoaded) {
          this.createNewNote();
        }
      })
    }

    this.visibleNotes = function() {
      return this.renderedNotes.filter(function(note){
        return note.visible;
      });
    }

    this.selectFirstNote = function() {
      var visibleNotes = this.visibleNotes();
      if(visibleNotes.length > 0) {
        this.selectNote(visibleNotes[0]);
      }
    }

    this.selectNextNote = function() {
      var visibleNotes = this.visibleNotes();
      let currentIndex = visibleNotes.indexOf(this.selectedNote);
      if(currentIndex + 1 < visibleNotes.length) {
        this.selectNote(visibleNotes[currentIndex + 1]);
      }
    }

    this.selectPreviousNote = function() {
      var visibleNotes = this.visibleNotes();
      let currentIndex = visibleNotes.indexOf(this.selectedNote);
      if(currentIndex - 1 >= 0) {
        this.selectNote(visibleNotes[currentIndex - 1]);
        return true;
      } else {
        return false;
      }
    }

    this.selectNote = async function(note, viaClick = false) {
      if(!note) {
        return;
      }

      let run = () => {
        $timeout(() => {
          let dummyNote;
          if(this.selectedNote && this.selectedNote != note && this.selectedNote.dummy) {
            // remove dummy
            dummyNote = this.selectedNote;
          }

          this.selectedNote = note;
          if(note.content.conflict_of) {
            note.content.conflict_of = null; // clear conflict
            modelManager.setItemDirty(note, true);
            syncManager.sync();
          }
          this.selectionMade()(note);
          this.selectedIndex = Math.max(this.visibleNotes().indexOf(note), 0);

          // There needs to be a long timeout after setting selection before removing the dummy
          // Otherwise, you'll click a note, remove this one, and strangely, the click event registers for a lower cell
          if(dummyNote) {
            $timeout(() => {
              modelManager.removeItemLocally(dummyNote);
              _.pull(this.notes, dummyNote);
            }, 250)
          }

          if(viaClick && this.isFiltering()) {
            desktopManager.searchText(this.noteFilter.text);
          }
        })
      }

      if(note.content.protected && await privilegesManager.actionRequiresPrivilege(PrivilegesManager.ActionViewProtectedNotes)) {
        privilegesManager.presentPrivilegesModal(PrivilegesManager.ActionViewProtectedNotes, () => {
          run();
        });
      } else {
        run();
      }
    }

    this.isFiltering = function() {
      return this.noteFilter.text && this.noteFilter.text.length > 0;
    }

    this.createNewNote = function() {
      // The "Note X" counter is based off this.notes.length, but sometimes, what you see in the list is only a subset.
      // We can use this.visibleNotes().length, but that only accounts for non-paginated results, so first 15 or so.
      var title = "Note" + (this.notes ? (" " + (this.notes.length + 1)) : "");
      let newNote = modelManager.createItem({content_type: "Note", content: {text: "", title: title}});
      newNote.dummy = true;
      this.newNote = newNote;
      this.selectNote(this.newNote);
      this.addNew()(this.newNote);
    }

    this.noteFilter = {text : ''};

    this.onFilterEnter = function() {
      // For Desktop, performing a search right away causes input to lose focus.
      // We wait until user explicity hits enter before highlighting desktop search results.
      this.searchSubmitted = true;
      desktopManager.searchText(this.noteFilter.text);
    }

    this.clearFilterText = function() {
      this.noteFilter.text = '';
      this.onFilterEnter();
      this.filterTextChanged();

      // Reset loaded notes
      this.resetPagination();
    }

    this.filterTextChanged = function() {
      if(this.searchSubmitted) {
        this.searchSubmitted = false;
      }

      this.reloadNotes();

      $timeout(() => {
        if(!this.selectedNote.visible) {
          this.selectFirstNote();
        }
      }, 100)
    }

    this.selectedMenuItem = function() {
      this.showMenu = false;
    }

    this.togglePrefKey = function(key) {
      this[key] = !this[key];
      authManager.setUserPrefValue(key, this[key]);
      authManager.syncUserPreferences();
      this.reloadNotes();
    }

    this.selectedSortByCreated = function() {
      this.setSortBy("created_at");
    }

    this.selectedSortByUpdated = function() {
      this.setSortBy("client_updated_at");
    }

    this.selectedSortByTitle = function() {
      this.setSortBy("title");
    }

    this.toggleReverseSort = function() {
      this.selectedMenuItem();
      this.sortReverse = !this.sortReverse;
      this.reorderNotes();
      authManager.setUserPrefValue("sortReverse", this.sortReverse);
      authManager.syncUserPreferences();
    }

    this.setSortBy = function(type) {
      this.sortBy = type;
      this.reorderNotes();
      authManager.setUserPrefValue("sortBy", this.sortBy);
      authManager.syncUserPreferences();
    }

    this.shouldShowTagsForNote = function(note) {
      if(this.hideTags || note.content.protected) {
        return false;
      }

      if(this.tag.content.isAllTag) {
        return note.tags && note.tags.length > 0;
      }

      if(this.tag.isSmartTag()) {
        return true;
      }

      // Inside a tag, only show tags string if note contains tags other than this.tag
      return note.tags && note.tags.length > 1;
    }

    this.filterNotes = function(notes) {
      return notes.filter((note) => {
        let canShowArchived = this.showArchived, canShowPinned = !this.hidePinned;
        let isTrash = this.tag.content.isTrashTag;

        if(!isTrash && note.content.trashed) {
          note.visible = false;
          return note.visible;
        }

        var isSmartTag = this.tag.isSmartTag();
        if(isSmartTag) {
          canShowArchived = canShowArchived || this.tag.content.isArchiveTag || isTrash;
        }

        if((note.archived && !canShowArchived) || (note.pinned && !canShowPinned)) {
          note.visible = false;
          return note.visible;
        }

        var filterText = this.noteFilter.text.toLowerCase();
        if(filterText.length == 0) {
          note.visible = true;
        } else {
          var words = filterText.split(" ");
          var matchesTitle = words.every(function(word) { return  note.safeTitle().toLowerCase().indexOf(word) >= 0; });
          var matchesBody = words.every(function(word) { return  note.safeText().toLowerCase().indexOf(word) >= 0; });
          note.visible = matchesTitle || matchesBody;
        }

        return note.visible;
      });
    }

    this.sortNotes = function(items, sortBy, reverse) {
      let sortValueFn = (a, b, pinCheck = false) => {
        if(a.dummy) { return -1; }
        if(b.dummy) { return 1; }
        if(!pinCheck) {
          if(a.pinned && b.pinned) {
            return sortValueFn(a, b, true);
          }
          if(a.pinned) { return -1; }
          if(b.pinned) { return 1; }
        }

        var aValue = a[sortBy] || "";
        var bValue = b[sortBy] || "";

        let vector = 1;

        if(reverse) {
          vector *= -1;
        }

        if(sortBy == "title") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();

          if(aValue.length == 0 && bValue.length == 0) {
            return 0;
          } else if(aValue.length == 0 && bValue.length != 0) {
            return 1 * vector;
          } else if(aValue.length != 0 && bValue.length == 0) {
            return -1 * vector;
          } else  {
            vector *= -1;
          }
        }

        if(aValue > bValue) { return -1 * vector;}
        else if(aValue < bValue) { return 1 * vector;}
        return 0;
      }

      items = items || [];
      var result = items.sort(function(a, b){
        return sortValueFn(a, b);
      })
      return result;
    };


    /*
      Keyboard Shortcuts
    */

    // In the browser we're not allowed to override cmd/ctrl + n, so we have to use Control modifier as well.
    // These rules don't apply to desktop, but probably better to be consistent.
    this.newNoteKeyObserver = keyboardManager.addKeyObserver({
      key: "n",
      modifiers: [KeyboardManager.KeyModifierMeta, KeyboardManager.KeyModifierCtrl],
      onKeyDown: (event) => {
        event.preventDefault();
        $timeout(() => {
          this.createNewNote();
        });
      }
    })

    this.getSearchBar = function() {
      return document.getElementById("search-bar");
    }

    this.nextNoteKeyObserver = keyboardManager.addKeyObserver({
      key: KeyboardManager.KeyDown,
      elements: [document.body, this.getSearchBar()],
      onKeyDown: (event) => {
        let searchBar = this.getSearchBar();
        if(searchBar == document.activeElement) {
          searchBar.blur()
        }
        $timeout(() => {
          this.selectNextNote();
        });
      }
    })

    this.nextNoteKeyObserver = keyboardManager.addKeyObserver({
      key: KeyboardManager.KeyUp,
      element: document.body,
      onKeyDown: (event) => {
        $timeout(() => {
          this.selectPreviousNote();
        });
      }
    });

    this.searchKeyObserver = keyboardManager.addKeyObserver({
      key: "f",
      modifiers: [KeyboardManager.KeyModifierMeta, KeyboardManager.KeyModifierShift],
      onKeyDown: (event) => {
        let searchBar = this.getSearchBar();
        if(searchBar) {searchBar.focus()};
      }
    })

  });
