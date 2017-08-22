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
  .controller('NotesCtrl', function (authManager, $timeout, $rootScope, modelManager) {

    this.sortBy = localStorage.getItem("sortBy") || "created_at";
    this.sortDescending = this.sortBy != "title";

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    $rootScope.$on("noteDeleted", function() {
      this.selectFirstNote(false);
    }.bind(this))

    this.notesToDisplay = 20;
    this.paginate = function() {
      this.notesToDisplay += 20
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
      var filterText = this.noteFilter.text.toLowerCase();
      if(filterText.length == 0) {
        note.visible = true;
      } else {
        note.visible = note.safeTitle().toLowerCase().includes(filterText) || note.safeText().toLowerCase().includes(filterText);
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
      localStorage.setItem("sortBy", type);
    }

  });
