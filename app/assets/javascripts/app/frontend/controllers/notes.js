angular.module('app.frontend')
  .directive("notesSection", function(){
    return {
      scope: {
        addNew: "&",
        selectionMade: "&",
        remove: "&",
        group: "=",
        user: "=",
        removeGroup: "&"
      },
      templateUrl: 'frontend/notes.html',
      replace: true,
      controller: 'NotesCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {
        scope.$watch('ctrl.group', function(group, oldGroup){
          if(group) {
            ctrl.groupDidChange(group, oldGroup);
          }
        });
      }
    }
  })
  .controller('NotesCtrl', function (apiController, $timeout, ngDialog, $rootScope) {

    $rootScope.$on("editorFocused", function(){
      this.showMenu = false;
    }.bind(this))

    var isFirstLoad = true;

    this.groupDidChange = function(group, oldGroup) {
      this.showMenu = false;

      if(this.selectedNote && this.selectedNote.dummy) {
        _.remove(oldGroup.notes, this.selectedNote);
      }

      this.noteFilter.text = "";
      this.setNotes(group.notes, false);

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
      } else if(group.notes.length == 0) {
          this.createNewNote();
      }
    }

    this.selectedGroupDelete = function() {
      this.showMenu = false;
      this.removeGroup()(this.group);
    }

    this.selectedGroupShare = function() {
      this.showMenu = false;

      if(!this.user.id) {
        alert("You must be signed in to share a group.");
        return;
      }

      if(this.group.all) {
        alert("You cannot share the 'All' group.");
        return;
      }

      if(this.user.local_encryption_enabled) {
        if(!confirm("Sharing this group will disable local encryption on all group notes.")) {
          return;
        }
      }

      var callback = function(username) {
        apiController.shareGroup(this.user, this.group, function(response){
        })
      }.bind(this);

      if(!this.user.getUsername()) {
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
        callback(this.user.getUsername());
      }
    }

    this.selectedGroupUnshare = function() {
      this.showMenu = false;
      apiController.unshareGroup(this.user, this.group, function(response){

      })
    }

    this.publicUrlForGroup = function() {
      return this.group.presentation.url;
    }

    this.setNotes = function(notes, createNew) {
      this.notes = notes;
      notes.forEach(function(note){
        note.visible = true;
      })
      apiController.decryptNotesWithLocalKey(notes);
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

      note.onDelete = function() {
        this.setNotes(this.group.notes, false);
      }.bind(this);
    }

    this.createNewNote = function() {
      var title = "New Note" + (this.notes ? (" " + (this.notes.length + 1)) : "");
      this.newNote = new Note({title: title, content: '', dummy: true});
      this.newNote.shared_via_group = this.group.presentation && this.group.presentation.enabled;
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
