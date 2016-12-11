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
      Auth
      */

      this.getCurrentUser = function(callback) {
        if(!localStorage.getItem("jwt")) {
          callback(null);
          return;
        }
        Restangular.one("users/current").get().then(function(response){
          callback(response);
        })
      }

      this.login = function(email, password, callback) {
        var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
        this.setGk(keys.gk);
        var request = Restangular.one("auth/sign_in.json");
        request.user = {password: keys.pw, email: email};
        request.post().then(function(response){
          localStorage.setItem("jwt", response.token);
          callback(response);
        })
      }

      this.register = function(email, password, callback) {
        var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
        this.setGk(keys.gk);
        var request = Restangular.one("auth.json");
        request.user = {password: keys.pw, email: email};
        request.post().then(function(response){
          localStorage.setItem("jwt", response.token);
          callback(response);
        })
      }

      this.changePassword = function(user, current_password, new_password) {
        var current_keys = Neeto.crypto.generateEncryptionKeysForUser(current_password, user.email);
        var new_keys = Neeto.crypto.generateEncryptionKeysForUser(new_password, user.email);

        var data = {};
        data.current_password = current_keys.pw;
        data.password = new_keys.pw;
        data.password_confirmation = new_keys.pw;

        var user = this.user;

        this._performPasswordChange(current_keys, new_keys, function(response){
          if(response && !response.errors) {
            // this.showNewPasswordForm = false;
            if(user.local_encryption_enabled) {
              // reencrypt data with new gk
              this.reencryptAllNotesAndSave(user, new_keys.gk, current_keys.gk, function(success){
                if(success) {
                  this.setGk(new_keys.gk);
                  alert("Your password has been changed and your data re-encrypted.");
                } else {
                  // rollback password
                  this._performPasswordChange(new_keys, current_keys, function(response){
                    alert("There was an error changing your password. Your password has been rolled back.");
                    window.location.reload();
                  })
                }
              }.bind(this));
            } else {
              alert("Your password has been changed.");
            }
          } else {
            // this.showNewPasswordForm = false;
            alert("There was an error changing your password. Please try again.");
          }
        })
      }

      this._performPasswordChange = function(email, current_keys, new_keys, callback) {
        var request = Restangular.one("auth");
        request.user = {password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email};
        request.patch().then(function(response){
          callback(response);
        })
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
          Restangular.one("users", user.id).one("groups", group.id).one("presentations").post()
          .then(function(response){
            var presentation = response.plain();
            group.notes.forEach(function(note){
              note.shared_via_group = true;
            });
            _.merge(group, {presentation: presentation});
            callback(presentation);
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
        var request = Restangular.one("users", user.id).one("groups", group.id).one("presentations", group.presentation.id);
        request.enabled = false;
        request.patch().then(function(response){
          var presentation = response.plain();
          _.merge(group, {presentation: presentation});
          callback(presentation);
        })
      }





      /*
      Notes
      */

      this.saveBatchNotes = function(user, notes, encryptionEnabled, callback) {
        var request = Restangular.one("users", user.id).one("notes/batch_update");
        request.notes = _.map(notes, function(note){
          return this.createRequestParamsFromNote(note, user);
        }.bind(this));
        request.put().then(function(response){
          var success = response.plain().success;
          callback(success);
        })
      }

      this.saveNote = function(user, note, callback) {
        if(!user.id) {
          this.writeUserToLocalStorage(user);
          callback(note);
          return;
        }

        var params = this.createRequestParamsFromNote(note, user);

        var request = Restangular.one("users", user.id).one("notes", note.id);
        _.merge(request, params);
        console.log("saving note", request);
        request.customOperation(request.id ? "put" : "post")
        .then(function(response) {
          var responseObject = response.plain();
          responseObject.content = note.content;
          _.merge(note, responseObject);
          callback(note);
        })
        .catch(function(response){
          callback(null);
        })
      }

      this.createRequestParamsFromNote = function(note, user) {
        var params = {};

        if(user.local_encryption_enabled && !note.pending_share && !note.isPublic()) {
          // encrypted
          var noteCopy = _.cloneDeep(note);
          this.encryptSingleNote(noteCopy, this.retrieveGk());

          params.loc_enc_content = noteCopy.loc_enc_content;
          params.loc_eek = noteCopy.loc_eek;
        }
        else {
          // decrypted
          params.content = note.JSONContent();
        }

        return params;
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
            _.merge(request, {name: note.title, content: note.content});
            request.post().then(function(response){
              var presentation = response.plain();
              _.merge(note, {presentation: presentation});
              note.locked = true;
              this.writeUserToLocalStorage(user);
              callback(note);
            }.bind(this))
          }
        } else {
          var shareFn = function(note, callback) {
            Restangular.one("users", user.id).one("notes", note.id).one("presentations").post()
            .then(function(response){
              var presentation = response.plain();
              _.merge(note, {presentation: presentation});
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
        var request = Restangular.one("users", user.id).one("notes", note.id).one("presentations", note.presentation.id);
        request.enabled = false;
        request.patch().then(function(response){
          var presentation = response.plain();
          _.merge(note, {presentation: presentation});
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
            title: note.title,
            text: note.text,
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

      this.signout = function() {
        localStorage.removeItem("jwt");
        localStorage.removeItem("gk");
      }

      this.encryptSingleNote = function(note, key) {
        var ek = null;
        if(note.isEncrypted()) {
          ek = Neeto.crypto.decryptText(note.loc_eek, key);
        } else {
          ek = Neeto.crypto.generateRandomEncryptionKey();
          note.loc_eek = Neeto.crypto.encryptText(ek, key);
        }
        note.loc_enc_content = Neeto.crypto.encryptText(note.JSONContent(), ek);
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
         var ek = Neeto.crypto.decryptText(note.loc_eek || note.local_eek, key);
         var content = Neeto.crypto.decryptText(note.loc_enc_content || note.local_encrypted_content, ek);
         note.content = content;
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
             var ek = Neeto.crypto.decryptText(note.loc_eek, oldKey);
             // now encrypt ek with new key
             note.loc_eek = Neeto.crypto.encryptText(ek, newKey);
           }
         });

         this.saveBatchNotes(user, notes, true, function(success) {
           callback(success);
         }.bind(this));
       }
     }
});
