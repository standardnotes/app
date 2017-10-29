angular.module('app.frontend')
  .directive("notesSection", function(){
    return {
      scope: {
        addNew: "&",
        selectionMade: "&",
        tag: "="
      },

      templateUrl: 'frontend/notes.html',
      replace: true,
      controller: 'NotesCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.tag', function(tag, oldTag){
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
  .controller('NotesCtrl', function (userManager, $timeout, $rootScope, modelManager, storageManager, keyboardManager) {

    this.keyboardManager = keyboardManager;
    keyboardManager.setContext('notes');

    keyboardManager.registerShortcut("down", "notes", false, () => {
      this.selectNextNote();
      var searchBar = document.getElementById("search-bar");
      if(searchBar) {searchBar.blur()};
    })

    keyboardManager.registerShortcut(["command+k", "command+n", "command+shift+n"], "*", true, () => {
      this.createNewNote();
    })

    keyboardManager.registerShortcut("up", "notes", false, () => {
      var handled = this.selectPreviousNote();
      if(!handled) {
        var searchBar = document.getElementById("search-bar");
        if(searchBar) {searchBar.focus()};
      }
    })

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
      }
      return false;
    }

    this.visibleNotes = function() {
      return this.sortedNotes.filter(function(note){
        return note.visible;
      });
    }

    this.panelController = {};

    $rootScope.$on("user-preferences-changed", () => {
      this.loadPreferences();
    });

    this.loadPreferences = function() {
      this.sortBy = userManager.userPreferences.getAppDataItem("sortBy") || "created_at";
      this.sortDescending = this.sortBy != "title";

      this.showArchived = userManager.getUserPref("showArchived", false);
      this.hidePinned = userManager.getUserPref("hidePinned", false);
      this.hideNotePreview = userManager.getUserPref("hideNotePreview", false);
      this.hideDate = userManager.getUserPref("hideDate", false);
      this.hideTags = userManager.getUserPref("hideTags", false);

      let width = userManager.userPreferences.getAppDataItem("notesPanelWidth");
      if(width) {
        this.panelController.setWidth(width);
      }
    }

    this.loadPreferences();

    this.onPanelResize = function(newWidth) {
      userManager.userPreferences.setAppDataItem("notesPanelWidth", newWidth);
      userManager.syncUserPreferences();
    }

    angular.element(document).ready(() => {
      this.loadPreferences();
    });

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    $rootScope.$on("noteDeleted", function() {
      this.selectFirstNote(false);
    }.bind(this))

    $rootScope.$on("noteArchived", function() {
      this.selectNextNote();
    }.bind(this))

    this.notesToDisplay = 20;
    this.paginate = function() {
      this.notesToDisplay += 20
    }

    this.panelTitle = function() {
      if(this.noteFilter.text.length) {
        return `${this.tag.notes.filter((i) => {return i.visible;}).length} search results`;
      } else if(this.tag) {
        return `${this.tag.title} notes`;
      }
    }

    this.optionsSubtitle = function() {
      var base = "";
      if(this.sortBy == "created_at") {
        base += " Date Added";
      } else if(this.sortBy == "updated_at") {
        base += " Date Modifed";
      } else if(this.sortBy == "title") {
        base += " Title";
      }

      if(this.showArchived && (!this.tag || !this.tag.archiveTag)) {
        base += " | + Archived"
      }

      if(this.hidePinned) {
        base += " | – Pinned"
      }

      return base;
    }

    this.toggleKey = function(key) {
      this[key] = !this[key];
      userManager.userPreferences.setAppDataItem(key, this[key]);
      userManager.syncUserPreferences();
    }

    this.tagDidChange = function(tag, oldTag) {
      this.showMenu = false;

      if(this.selectedNote && this.selectedNote.dummy) {
        _.remove(oldTag.notes, this.selectedNote);
      }

      this.noteFilter.text = "";
      this.setNotes(tag.notes);
    }

    this.setNotes = function(notes) {
      notes.forEach(function(note){
        note.visible = true;
      })

      var createNew = notes.length == 0;
      this.selectFirstNote(createNew);
    }

    this.selectFirstNote = function(createNew) {
      var visibleNotes = this.sortedNotes.filter(function(note){
        return note.visible;
      });

      if(visibleNotes.length > 0) {
        this.selectNote(visibleNotes[0]);
      } else if(createNew) {
        this.createNewNote();
      }
    }

    this.selectNote = function(note) {
      this.selectedNote = note;
      note.conflict_of = null; // clear conflict
      this.selectionMade()(note);
    }

    this.createNewNote = function() {
      var title = "New Note" + (this.tag.notes ? (" " + (this.tag.notes.length + 1)) : "");
      this.newNote = modelManager.createItem({content_type: "Note", dummy: true, text: ""});
      this.newNote.title = title;
      this.selectNote(this.newNote);
      this.addNew()(this.newNote);
    }

    this.noteFilter = {text : ''};

    this.filterNotes = function(note) {
      if(this.tag.archiveTag) {
        note.visible = note.archived;
        return note.visible;
      }

      if((note.archived && !this.showArchived) || (note.pinned && this.hidePinned)) {
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

    this.filterTextChanged = function() {
      $timeout(function(){
        if(!this.selectedNote.visible) {
          this.selectFirstNote(false);
        }
      }.bind(this), 100)
    }

    this.selectedMenuItem = function($event) {
      this.showMenu = false;
    }

    this.selectedSortByCreated = function() {
      this.setSortBy("created_at");
      this.sortDescending = true;
    }

    this.selectedSortByUpdated = function() {
      this.setSortBy("updated_at");
      this.sortDescending = true;
    }

    this.selectedSortByTitle = function() {
      this.setSortBy("title");
      this.sortDescending = false;
    }

    this.setSortBy = function(type) {
      this.sortBy = type;
      userManager.userPreferences.setAppDataItem("sortBy", this.sortBy);
      userManager.syncUserPreferences();
    }

  });
