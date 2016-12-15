angular.module('app.frontend')
  .directive("notesSection", function(){
    return {
      scope: {
        addNew: "&",
        selectionMade: "&",
        remove: "&",
        tag: "=",
        user: "=",
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
  .controller('NotesCtrl', function (apiController, modelManager, $timeout, ngDialog, $rootScope) {

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    var isFirstLoad = true;

    this.tagDidChange = function(tag, oldTag) {
      this.showMenu = false;

      if(this.selectedNote && this.selectedNote.dummy) {
        _.remove(oldTag.notes, this.selectedNote);
      }

      this.noteFilter.text = "";
      this.setNotes(tag.notes, false);

      if(isFirstLoad) {
        $timeout(function(){
          var draft = apiController.getDraft();
          if(draft) {
            var note = draft;
            this.selectNote(note);
          } else {
            this.createNewNote();
            isFirstLoad = false;
          }
        }.bind(this))
      } else if(tag.notes.length == 0) {
          this.createNewNote();
      }
    }

    this.selectedTagDelete = function() {
      this.showMenu = false;
      this.removeTag()(this.tag);
    }

    this.selectedTagShare = function() {
      this.showMenu = false;

      if(!this.user.id) {
        alert("You must be signed in to share a tag.");
        return;
      }

      if(this.tag.all) {
        alert("You cannot share the 'All' tag.");
        return;
      }

      var callback = function(username) {
        apiController.shareItem(this.user, this.tag, function(response){
        })
      }.bind(this);

      if(!this.user.username) {
        ngDialog.open({
          template: 'frontend/modals/username.html',
          controller: 'UsernameModalCtrl',
          resolve: {
            user: function() {return this.user}.bind(this),
            callback: function() {return callback}
          },
          className: 'ngdialog-theme-default',
          disableAnimation: true
        });
      } else {
        callback(this.user.username);
      }
    }

    this.selectedTagUnshare = function() {
      this.showMenu = false;
      apiController.unshareItem(this.user, this.tag, function(response){

      })
    }

    this.publicUrlForTag = function() {
      return this.tag.presentation.url;
    }

    this.setNotes = function(notes, createNew) {
      this.notes = notes;
      console.log("set notes", notes);
      notes.forEach(function(note){
        note.visible = true;
      })
      this.selectFirstNote(createNew);
    }

    this.selectFirstNote = function(createNew) {
      var visibleNotes = this.notes.filter(function(note){
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
      var title = "New Note" + (this.notes ? (" " + (this.notes.length + 1)) : "");
      this.newNote = new Note({dummy: true});
      this.newNote.content.title = title;
      if(this.tag && !this.tag.all) {
        modelManager.addTagToNote(this.tag, this.newNote);
      }
      this.selectNote(this.newNote);
      this.addNew()(this.newNote);
    }

    this.noteFilter = {text : ''};

    this.filterNotes = function(note) {
      if(this.noteFilter.text.length == 0) {
        note.visible = true;
      } else {
        note.visible = note.title.toLowerCase().includes(this.noteFilter.text) || note.text.toLowerCase().includes(this.noteFilter.text);
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
