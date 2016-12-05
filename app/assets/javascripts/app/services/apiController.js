angular.module('app.services')
  .provider('apiController', function () {

    function domainName()  {
      var domain_comps = location.hostname.split(".");
      var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
      return domain;
    }

    var url;

    this.defaultServerURL = function() {
      if(!url) {
        url = localStorage.getItem("server");
        if(!url) {
          url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port: '');
        }
      }
      return url;
    }


    this.$get = function(Restangular) {
        return new ApiController(Restangular);
    }

    function ApiController(Restangular) {

      /*
      Config
      */

      this.getServer = function() {
        if(!url) {
          url = localStorage.getItem("server");
          if(!url) {
            url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port: '');
            this.setServer(url);
          }
        }
        return url;
      }

      this.setServer = function(url, refresh) {
        localStorage.setItem("server", url);
        if(refresh) {
          window.location.reload();
        }
      }

      /*
      User
      */

      this.setUsername = function(user, username, callback) {
        var request = Restangular.one("users", user.id).one("set_username");
        request.username = username;
        request.post().then(function(response){
          callback(response.plain());
        })
      }

      this.enableEncryptionForUser = function(user, callback) {
        Restangular.one("users", user.id).one('enable_encryption').post().then(function(response){

          var enabled = response.plain().local_encryption_enabled;
          if(!enabled) {
            callback(false, enabled);
            return;
          }
          this.handleEncryptionStatusChange(user, enabled, callback);
        }.bind(this))
      }

      this.disableEncryptionForUser = function(user, callback) {

        Restangular.one("users", user.id).one('disable_encryption').post().then(function(response){
          var enabled = response.plain().local_encryption_enabled;

          if(enabled) {
            // something went wrong
            callback(false, enabled);
            return;
          }
          this.handleEncryptionStatusChange(user, enabled, callback);
        }.bind(this))
      }

      this.handleEncryptionStatusChange = function(user, encryptionEnabled, callback) {
        var allNotes = user.filteredNotes();
        if(encryptionEnabled) {
          allNotes = allNotes.filter(function(note){return note.isPublic() == false});
          this.encryptNotes(allNotes, this.retrieveGk());
        } else {
          this.decryptNotes(allNotes, this.retrieveGk());
        }

        this.saveBatchNotes(user, allNotes, encryptionEnabled, function(success) {
          callback(success, encryptionEnabled);
        }.bind(this));
      }

      /*
      Ensures that if encryption is disabled, all local notes are uncrypted,
      and that if it's enabled, that all local notes are encrypted
      */
      this.verifyEncryptionStatusOfAllNotes = function(user, callback) {
        var allNotes = user.filteredNotes();
        var notesNeedingUpdate = [];
        var key = this.retrieveGk();
        allNotes.forEach(function(note){
          if(user.local_encryption_enabled && !note.isPublic()) {
            if(!note.isEncrypted()) {
              // needs encryption
              this.encryptSingleNote(note, key);
              notesNeedingUpdate.push(note);
            }
          } else {
            if(note.isEncrypted()) {
              // needs decrypting
              this.decryptSingleNote(note, key);
              notesNeedingUpdate.push(note);
            }
          }
        }.bind(this))

        if(notesNeedingUpdate.length > 0) {
          this.saveBatchNotes(user, notesNeedingUpdate, user.local_encryption_enabled, callback)
        }
      }



      /*
      Groups
      */

      this.restangularizeGroup = function(group, user) {
        var request = Restangular.one("users", user.id).one("groups", group.id);
        _.merge(request, group);
        return request;
      }

      this.saveGroup = function(user, group, callback) {
        if(user.id) {
          if(!group.route) {
            group = this.restangularizeGroup(group, user);
          }
          group.customOperation(group.id ? "put" : "post").then(function(response) {
            callback(response.plain());
          })
        } else {
          this.writeUserToLocalStorage(user);
          callback(group);
        }
      }

      this.deleteGroup = function(user, group, callback) {
        if(!user.id) {
          _.remove(user.groups, group);
          this.writeUserToLocalStorage(user);
          callback(true);
        } else {
          Restangular.one("users", user.id).one("groups", group.id).remove()
          .then(function(response) {
            _.remove(user.groups, group);
            callback(true);
          })
        }
      }

      this.shareGroup = function(user, group, callback) {
        var shareFn = function() {
          Restangular.one("users", user.id).one("groups", group.id).one("share").post()
          .then(function(response){
            var obj = response.plain();
            group.notes.forEach(function(note){
              note.shared_via_group = true;
            });
            _.merge(group, {presentation: obj.presentation});
            callback(obj);
          })
        }

        if(user.local_encryption_enabled && group.notes.length > 0) {
          // decrypt group notes first
          var notes = group.notes;
          this.decryptNotesWithLocalKey(notes);
          this.saveBatchNotes(user, notes, false, function(success){
            shareFn();
          })
        } else {
          shareFn();
        }
      }

      this.unshareGroup = function(user, group, callback) {
        Restangular.one("users", user.id).one("groups", group.id).one("unshare").post()
        .then(function(response){
          var obj = response.plain();
          _.merge(group, {presentation: obj.presentation});
          callback(obj);
        })
      }





      /*
      Notes
      */

      this.saveBatchNotes = function(user, notes, encryptionEnabled, callback) {
        notes = _.cloneDeep(notes);
        notes.forEach(function(note){
          if(encryptionEnabled && !note.isPublic()) {
            note.content = null;
            note.name = null;
          } else {
            note.local_encrypted_content = null;
            note.local_eek = null;
          }
        })

        var request = Restangular.one("users", user.id).one("notes/batch_update");
        request.notes = notes;
        request.put().then(function(response){
          var success = response.plain().success;
          callback(success);
        })
      }

      this.preprocessNoteForSaving = function(note,  user) {
        if(user.local_encryption_enabled && !note.pending_share && !note.isPublic()) {
          // encrypt
          this.encryptSingleNote(note, this.retrieveGk());
          note.content = null; // dont send unencrypted content to server
          note.name = null;
        }
        else {
          // decrypt
          note.local_encrypted_content = null;
          note.local_eek = null;
          note.local_encryption_scheme = null;
        }
      }

      this.saveNote = function(user, note, callback) {
        if(!user.id) {
          this.writeUserToLocalStorage(user);
          callback(note);
          return;
        }

        var snipCopy = _.cloneDeep(note);

        this.preprocessNoteForSaving(snipCopy, user);

        var request = Restangular.one("users", user.id).one("notes", note.id);
        _.merge(request, snipCopy);

        request.customOperation(request.id ? "put" : "post")
        .then(function(response) {
          var responseObject = response.plain();
          responseObject.content = note.content;
          responseObject.name = note.name;
          _.merge(note, responseObject);
          callback(note);
        })
        .catch(function(response){
          callback(null);
        })
      }

      this.deleteNote = function(user, note, callback) {
        if(!user.id) {
          this.writeUserToLocalStorage(user);
          callback(true);
        } else {
          Restangular.one("users", user.id).one("notes", note.id).remove()
          .then(function(response) {
            callback(true);
          })
        }
      }

      this.shareNote = function(user, note, callback) {
        if(!user.id) {
          if(confirm("Note: You are not signed in. Any note you share cannot be edited or unshared.")) {
            var request = Restangular.one("notes").one("share");
            _.merge(request, {name: note.name, content: note.content});
            request.post().then(function(response){
              var obj = response.plain();
              _.merge(note, {presentation: obj.presentation});
              note.locked = true;
              this.writeUserToLocalStorage(user);
              callback(note);
            }.bind(this))
          }
        } else {
          var shareFn = function(note, callback) {
            Restangular.one("users", user.id).one("notes", note.id).one("share").post()
            .then(function(response){
              var obj = response.plain();
              _.merge(note, {presentation: obj.presentation});
              callback(note);
            })
          }

          if(user.local_encryption_enabled) {
            if(confirm("Note: Sharing this note will remove its local encryption.")) {
              note.pending_share = true;
              this.saveNote(user, note, function(saved_note){
                shareFn(saved_note, callback);
              })
            }
          } else {
            shareFn(note, callback);
          }
        }
      }

      this.unshareNote = function(user, note, callback) {
        Restangular.one("users", user.id).one("notes", note.id).one("unshare").post()
        .then(function(response){
          var obj = response.plain();
          _.merge(note, {presentation: obj.presentation});
          callback(note);
        })
      }

      this.notesDataFile = function(user) {
        var textFile = null;
        var makeTextFile = function (text) {
          var data = new Blob([text], {type: 'text/json'});

          // If we are replacing a previously generated file we need to
          // manually revoke the object URL to avoid memory leaks.
          if (textFile !== null) {
            window.URL.revokeObjectURL(textFile);
          }

          textFile = window.URL.createObjectURL(data);

          // returns a URL you can use as a href
          return textFile;
        }.bind(this);

        // remove irrelevant keys
        var notes = _.map(user.filteredNotes(), function(note){
          return {
            id: note.id,
            name: note.name,
            content: note.content,
            created_at: note.created_at,
            modified_at: note.modified_at,
            group_id: note.group_id
          }
        });
        return makeTextFile(JSON.stringify(notes, null, 2 /* pretty print */));
      }




      /*
      Merging
      */
      this.mergeLocalDataRemotely = function(user, callback) {
        var request = Restangular.one("users", user.id).one("merge");
        var groups = user.groups;
        request.notes = user.notes;
        request.notes.forEach(function(note){
          if(note.group_id) {
            var group = groups.filter(function(group){return group.id == note.group_id})[0];
            note.group_name = group.name;
          }
        })
        request.post().then(function(response){
          callback();
          localStorage.removeItem('user');
        })
      }






      this.filterDummyNotes = function(notes) {
        var filtered = notes.filter(function(note){return note.dummy == false || note.dummy == null});
        return filtered;
      }

      this.staticifyObject = function(object) {
        return JSON.parse(JSON.stringify(object));
      }

      this.writeUserToLocalStorage = function(user) {
        var saveUser = _.cloneDeep(user);
        saveUser.notes = this.filterDummyNotes(saveUser.notes);
        saveUser.groups.forEach(function(group){
          group.notes = null;
        }.bind(this))
        this.writeToLocalStorage('user', saveUser);
      }

      this.writeToLocalStorage = function(key, value) {
        localStorage.setItem(key, angular.toJson(value));
      }

      this.localUser = function() {
        var user = JSON.parse(localStorage.getItem('user'));
        if(!user) {
          user = {notes: [], groups: []};
        }
        user.shouldMerge = true;
        return user;
      }

      /*
      Drafts
      */

      this.saveDraftToDisk = function(draft) {
        localStorage.setItem("draft", JSON.stringify(draft));
      }

      this.clearDraft = function() {
        localStorage.removeItem("draft");
      }

      this.getDraft = function() {
        var draftString = localStorage.getItem("draft");
        if(!draftString || draftString == 'undefined') {
          return null;
        }
        return new Note(JSON.parse(draftString));
      }


      /*
      Encrpytion
      */

      this.retrieveGk = function() {
        if(!this.gk) {
          this.gk = localStorage.getItem("gk");
        }
        return this.gk;
      }

      this.setGk = function(gk) {
        localStorage.setItem('gk', gk);
      }

      this.clearGk = function() {
        localStorage.removeItem("gk");
      }

      this.encryptSingleNote = function(note, key) {
        var ek = null;
        if(note.isEncrypted()) {
          ek = Neeto.crypto.decryptText(note.local_eek, key);
        } else {
          ek = Neeto.crypto.generateRandomEncryptionKey();
          note.local_eek = Neeto.crypto.encryptText(ek, key);
        }
        var text = JSON.stringify({name: note.name, content: note.content});
        note.local_encrypted_content = Neeto.crypto.encryptText(text, ek);
        note.local_encryption_scheme = "1.0";
      }

      this.encryptNotes = function(notes, key) {
        notes.forEach(function(note){
          this.encryptSingleNote(note, key);
        }.bind(this));
      }

      this.encryptSingleNoteWithLocalKey = function(note) {
        this.encryptSingleNote(note, this.retrieveGk());
      }

      this.encryptNotesWithLocalKey = function(notes) {
        this.encryptNotes(notes, this.retrieveGk());
      }

      this.decryptSingleNoteWithLocalKey = function(note) {
        this.decryptSingleNote(note, this.retrieveGk());
      }

       this.decryptSingleNote = function(note, key) {
         var ek = Neeto.crypto.decryptText(note.local_eek, key);
         var obj = JSON.parse(Neeto.crypto.decryptText(note.local_encrypted_content, ek));
         note.name = obj.name;
         note.content = obj.content;
       }

       this.decryptNotes = function(notes, key) {
         notes.forEach(function(note){
           if(note.isEncrypted()) {
             this.decryptSingleNote(note, key);
           }
         }.bind(this));
       }

       this.decryptNotesWithLocalKey = function(notes) {
         this.decryptNotes(notes, this.retrieveGk());
       }

       this.reencryptAllNotesAndSave = function(user, newKey, oldKey, callback) {
         var notes = user.filteredNotes();
         notes.forEach(function(note){
           if(note.isEncrypted()) {
             // first decrypt eek with old key
             var ek = Neeto.crypto.decryptText(note.local_eek, oldKey);
             // now encrypt ek with new key
             note.local_eek = Neeto.crypto.encryptText(ek, newKey);
           }
         });

         this.saveBatchNotes(user, notes, true, function(success) {
           callback(success);
         }.bind(this));
       }
     }
});
