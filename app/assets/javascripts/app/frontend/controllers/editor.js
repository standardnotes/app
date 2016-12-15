angular.module('app.frontend')
  .directive("editorSection", function($timeout){
    return {
      restrict: 'E',
      scope: {
        save: "&",
        remove: "&",
        note: "=",
        user: "="
      },
      templateUrl: 'frontend/editor.html',
      replace: true,
      controller: 'EditorCtrl',
      controllerAs: 'ctrl',
      bindToController: true,

      link:function(scope, elem, attrs, ctrl) {

        var handler = function(event) {
          if (event.ctrlKey || event.metaKey) {
              switch (String.fromCharCode(event.which).toLowerCase()) {
              case 's':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.saveNote(event);
                  });
                  break;
              case 'e':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.clickedEditNote();
                  })
                  break;
              case 'm':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.toggleMarkdown();
                  })
                  break;
              case 'o':
                  event.preventDefault();
                  $timeout(function(){
                    ctrl.toggleFullScreen();
                  })
                  break;
              }
          }
        };

        window.addEventListener('keydown', handler);

        scope.$on('$destroy', function(){
          window.removeEventListener('keydown', handler);
        })

        scope.$watch('ctrl.note', function(note, oldNote){
          if(note) {
            ctrl.setNote(note, oldNote);
          } else {
            ctrl.note = {};
          }
        });
      }
    }
  })
  .controller('EditorCtrl', function ($sce, $timeout, apiController, markdownRenderer, $rootScope) {

    this.demoNotes = [
      {title: "Live print a file with tail", content: "tail -f log/production.log"},
      {title: "Create SSH tunnel", content: "ssh -i .ssh/key.pem -N -L 3306:example.com:3306 ec2-user@example.com"},
      {title: "List of processes running on port", content: "lsof -i:8080"},
      {title: "Set ENV from file", content: "export $(cat .envfile | xargs)"},
      {title: "Find process by name", content: "ps -ax | grep <application name>"},
      {title: "NPM install without sudo", content: "sudo chown -R $(whoami) ~/.npm"},
      {title: "Email validation regex", content: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"},
      {title: "Ruby generate 256 bit key", content: "Digest::SHA256.hexdigest(SecureRandom.random_bytes(32))"},
      {title: "Mac add user to user group", content: "sudo dseditgroup -o edit -a USERNAME -t user GROUPNAME"},
      {title: "Kill Mac OS System Apache", content: "sudo launchctl unload -w /System/Library/LaunchDaemons/org.apache.httpd.plist"},
      {title: "Docker run with mount binding and port", content: "docker run -v /home/vagrant/www/app:/var/www/app -p 8080:80 -d kpi/s3"},
      {title: "MySQL grant privileges", content: "GRANT [type of permission] ON [database name].[table name] TO ‘[username]’@'%’;"},
      {title: "MySQL list users", content: "SELECT User FROM mysql.user;"},
    ];

    this.showSampler = !this.user.id && this.user.filteredNotes().length == 0;

    this.demoNoteNames = _.map(this.demoNotes, function(note){
      return note.title;
    });

    this.currentDemoContent = {text: null};

    this.prebeginFn = function() {
        this.currentDemoContent.text = null;
    }.bind(this)

    this.callback = function(index) {
      this.currentDemoContent.text = this.demoNotes[index].text;
    }.bind(this)

    this.contentCallback = function(index) {
    }

    this.setNote = function(note, oldNote) {
      this.editorMode = 'edit';
      if(note.content.text.length == 0) {
        this.focusTitle(100);
      }

      if(oldNote && oldNote != note) {
        if(oldNote.hasChanges) {
          this.save()(oldNote, null);
        } else if(oldNote.dummy) {
          this.remove()(oldNote);
        }
      }
    }

    this.onPreviewDoubleClick = function() {
      this.editorMode = 'edit';
      this.focusEditor(100);
    }

    this.focusEditor = function(delay) {
      setTimeout(function(){
        var element = document.getElementById("note-text-editor");
        element.focus();
      }, delay)
    }

    this.focusTitle = function(delay) {
      setTimeout(function(){
        document.getElementById("note-title-editor").focus();
      }, delay)
    }

    this.clickedTextArea = function() {
      this.showMenu = false;
    }

    this.renderedContent = function() {
      return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText(this.note.content.text));
    }

    var statusTimeout;

    this.saveNote = function($event) {
      var note = this.note;
      note.dummy = false;
      this.save()(note, function(success){
        if(success) {
          apiController.clearDraft();

          if(statusTimeout) $timeout.cancel(statusTimeout);
          statusTimeout = $timeout(function(){
            this.noteStatus = "All changes saved"
          }.bind(this), 200)
        }
      }.bind(this));
    }

    this.saveTitle = function($event) {
      $event.target.blur();
      this.saveNote($event);
      this.focusEditor();
    }

    var saveTimeout;
    this.changesMade = function() {
      this.note.hasChanges = true;
      this.note.dummy = false;
      apiController.saveDraftToDisk(this.note);

      if(saveTimeout) $timeout.cancel(saveTimeout);
      if(statusTimeout) $timeout.cancel(statusTimeout);
      saveTimeout = $timeout(function(){
        this.noteStatus = "Saving...";
        this.saveNote();
      }.bind(this), 150)
    }


    this.contentChanged = function() {
      this.changesMade();
    }

    this.nameChanged = function() {
      this.changesMade();
    }

    this.onNameFocus = function() {
      this.editingName = true;
    }

    this.onContentFocus = function() {
      this.showSampler = false;
      $rootScope.$broadcast("editorFocused");
      this.editingUrl = false;
    }

    this.onNameBlur = function() {
      this.editingName = false;
    }

    this.toggleFullScreen = function() {
      this.fullscreen = !this.fullscreen;
      if(this.fullscreen) {
        if(this.editorMode == 'edit') {
          // refocus
          this.focusEditor(0);
        }
      } else {

      }
    }

    this.selectedMenuItem = function() {
      this.showMenu = false;
    }

    this.toggleMarkdown = function() {
      if(this.editorMode == 'preview') {
        this.editorMode = 'edit';
      } else {
        this.editorMode = 'preview';
      }
    }

    this.editUrlPressed = function() {
      this.showMenu = false;
      var url = this.publicUrlForNote(this.note);
      url = url.replace(this.note.presentation.root_path, "");
      this.url = {base: url, token : this.note.presentation.root_path};
      this.editingUrl = true;
    }

    this.saveUrl = function($event) {
      $event.target.blur();

      var original = this.note.presentation.relative_path;
      this.note.presentation.relative_path = this.url.token;

      apiController.updatePresentation(this.note, this.note.presentation, function(response){
        if(!response) {
          this.note.presentation.relative_path = original;
          this.url.token = original;
          alert("This URL is not available.");
        } else {
          this.editingUrl = false;
        }
      }.bind(this))
    }

    this.shareNote = function() {

      function openInNewTab(url) {
        var a = document.createElement("a");
        a.target = "_blank";
        a.href = url;
        a.click();
    }

      apiController.shareItem(this.user, this.note, function(note){
        openInNewTab(this.publicUrlForNote(note));
      }.bind(this))
      this.showMenu = false;
    }

    this.unshareNote = function() {
      apiController.unshareItem(this.user, this.note, function(note){

      })
      this.showMenu = false;
    }

    this.publicUrlForNote = function() {
      return this.note.presentationURL();
    }

    this.clickedMenu = function() {
      if(this.note.locked) {
        alert("This note has been shared without an account, and can therefore not be changed.")
      } else {
        this.showMenu = !this.showMenu;
      }
    }

    this.deleteNote = function() {
      apiController.clearDraft();
      this.remove()(this.note);
      this.showMenu = false;
    }

    this.clickedEditNote = function() {
      this.editorMode = 'edit';
      this.focusEditor(100);
    }

  });
