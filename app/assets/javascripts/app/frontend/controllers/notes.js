angular.module('app.frontend')
  .directive("notesSection", function(){
    return {
      scope: {
        addNew: "&",
        selectionMade: "&",
        remove: "&",
        tag: "=",
        removeTag: "&"
      },

      templateUrl: 'frontend/notes.html',
      replace: true,
      controller: 'NotesCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.tag', function(tag, oldTag){
          if(tag) {
            ctrl.tagDidChange(tag, oldTag);
          }
        });
      }
    }
  })
  .controller('NotesCtrl', function (authManager, $timeout, $rootScope, modelManager) {

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    $rootScope.$on("noteDeleted", function() {
      this.selectFirstNote(false);
    }.bind(this))

    var isFirstLoad = true;

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

      tag.notes.forEach(function(note){
        note.visible = true;
      })
      this.selectFirstNote(false);

      if(isFirstLoad) {
        $timeout(function(){
          this.createNewNote();
          isFirstLoad = false;
        }.bind(this))
      } else if(tag.notes.length == 0) {
          this.createNewNote();
      }
    }

    this.selectedTagDelete = function() {
      this.showMenu = false;
      this.removeTag()(this.tag);
    }

    this.selectFirstNote = function(createNew) {
      var visibleNotes = this.tag.notes.filter(function(note){
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
  });
