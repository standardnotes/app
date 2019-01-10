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
            if(tag.needsLoad) {
              scope.$watch('ctrl.tag.didLoad', function(didLoad){
                if(didLoad) {
                  tag.needsLoad = false;
                  ctrl.tagDidChange(tag, oldTag);
                }
              });
            } else {
              ctrl.tagDidChange(tag, oldTag);
            }
          }
        });
      }
    }
  })
  .controller('NotesCtrl', function (authManager, $timeout, $rootScope, modelManager,
    storageManager, desktopManager, privilegesManager) {

    this.panelController = {};
    this.searchSubmitted = false;

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    modelManager.addItemSyncObserver("note-list", "Note", (allItems, validItems, deletedItems, source, sourceKey) => {
      // Note has changed values, reset its flags
      for(var note of allItems) {
        note.flags = null;
      }
    });

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
      if(this.selectedIndex < visibleNotes.length) {
        this.selectNote(visibleNotes[Math.max(this.selectedIndex, 0)]);
      } else {
        this.selectNote(visibleNotes[visibleNotes.length - 1]);
      }
    }

    let MinNoteHeight = 51.0; // This is the height of a note cell with nothing but the title, which *is* a display option
    this.DefaultNotesToDisplayValue = (document.documentElement.clientHeight / MinNoteHeight) || 20;

    this.paginate = function() {
      this.notesToDisplay += this.DefaultNotesToDisplayValue

      if (this.searchSubmitted) {
        desktopManager.searchText(this.noteFilter.text);
      }
    }

    this.resetPagination = function() {
      this.notesToDisplay = this.DefaultNotesToDisplayValue;
    }

    this.resetPagination();

    this.panelTitle = function() {
      if(this.isFiltering()) {
        return `${this.tag.notes.filter((i) => {return i.visible;}).length} search results`;
      } else if(this.tag) {
        return `${this.tag.title}`;
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

      if(!this.tag || !this.tag.isSmartTag()) {
        // These rules don't apply for smart tags
        if(this.showArchived) {
          base += " | + Archived"
        }
        if(this.hidePinned) {
          base += " | – Pinned"
        }
      }

      return base;
    }

    this.getNoteFlags = (note) => {
      if(note.flags) {
        return note.flags;
      }

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

      note.flags = flags;

      return flags;
    }

    this.toggleKey = function(key) {
      this[key] = !this[key];
      authManager.setUserPrefValue(key, this[key]);
      authManager.syncUserPreferences();
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
    }

    this.setNotes = function(notes) {
      notes.forEach((note) => {
        note.visible = true;
      })

      var createNew = this.visibleNotes().length == 0;
      this.selectFirstNote(createNew);
    }

    this.visibleNotes = function() {
      return this.sortedNotes.filter(function(note){
        return note.visible;
      });
    }

    this.selectFirstNote = function(createNew) {
      var visibleNotes = this.visibleNotes();

      if(visibleNotes.length > 0) {
        this.selectNote(visibleNotes[0]);
      } else if(createNew) {
        this.createNewNote();
      }
    }

    this.selectNote = async function(note, viaClick = false) {
      if(!note) {
        this.createNewNote();
        return;
      }

      let run = () => {
        $timeout(() => {
          this.selectedNote = note;
          note.conflict_of = null; // clear conflict
          this.selectionMade()(note);
          this.selectedIndex = Math.max(this.visibleNotes().indexOf(note), 0);

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
      // The "Note X" counter is based off this.tag.notes.length, but sometimes, what you see in the list is only a subset.
      // We can use this.visibleNotes().length, but that only accounts for non-paginated results, so first 15 or so.
      var title = "Note" + (this.tag.notes ? (" " + (this.tag.notes.length + 1)) : "");
      let newNote = modelManager.createItem({content_type: "Note", content: {text: "", title: title}});
      newNote.dummy = true;
      this.newNote = newNote;
      this.selectNote(this.newNote);
      this.addNew()(this.newNote);
    }

    this.noteFilter = {text : ''};

    this.filterNotes = function(note) {
      var canShowArchived = false, canShowPinned = true;
      var isSmartTag = this.tag.isSmartTag();
      if(isSmartTag) {
        canShowArchived = this.tag.isReferencingArchivedNotes();
      } else {
        canShowArchived = this.showArchived;
        canShowPinned = !this.hidePinned;
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
    }.bind(this)

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
      if (this.searchSubmitted) {
        this.searchSubmitted = false;
      }

      $timeout(function(){
        if(!this.selectedNote.visible) {
          this.selectFirstNote(false);
        }
      }.bind(this), 100)
    }

    this.selectedMenuItem = function() {
      this.showMenu = false;
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
      authManager.setUserPrefValue("sortReverse", this.sortReverse);
      authManager.syncUserPreferences();
    }

    this.setSortBy = function(type) {
      this.sortBy = type;
      authManager.setUserPrefValue("sortBy", this.sortBy);
      authManager.syncUserPreferences();
    }

    this.shouldShowTags = function(note) {
      if(this.hideTags) {
        return false;
      }

      if(this.tag.content.isAllTag) {
        return note.tags && note.tags.length > 0;
      }

      // Inside a tag, only show tags string if note contains tags other than this.tag
      return note.tags && note.tags.length > 1;
    }

  });
