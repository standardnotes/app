class ArchiveManager {

  constructor(passcodeManager, authManager, modelManager) {
    this.passcodeManager = passcodeManager;
    this.authManager = authManager;
    this.modelManager = modelManager;
  }

  /*
  Public
  */

  downloadBackup(encrypted) {
    // download in Standard File format
    var keys, authParams, protocolVersion;
    if(encrypted) {
      if(this.authManager.offline() && this.passcodeManager.hasPasscode()) {
        keys = this.passcodeManager.keys();
        authParams = this.passcodeManager.passcodeAuthParams();
        protocolVersion = authParams.version;
      } else {
        keys = this.authManager.keys();
        authParams = this.authManager.getAuthParams();
        protocolVersion = this.authManager.protocolVersion();
      }
    }
    this.__itemsData(keys, authParams, protocolVersion).then((data) => {
      this.__downloadData(data, `SN Archive - ${new Date()}.txt`);

      // download as zipped plain text files
      if(!keys) {
        var notes = this.modelManager.allItemsMatchingTypes(["Note"]);
        this.__downloadZippedNotes(notes);
      }
    })
  }

  /*
  Private
  */

  async __itemsData(keys, authParams, protocolVersion) {
    let data = await this.modelManager.getAllItemsJSONData(keys, authParams, protocolVersion);
    let blobData = new Blob([data], {type: 'text/json'});
    return blobData;
  }

  __loadZip(callback) {
    if(window.zip) {
      callback();
      return;
    }

    var scriptTag = document.createElement('script');
    scriptTag.src = "/assets/zip/zip.js";
    scriptTag.async = false;
    var headTag = document.getElementsByTagName('head')[0];
    headTag.appendChild(scriptTag);
    scriptTag.onload = function() {
      zip.workerScriptsPath = "assets/zip/";
      callback();
    }
  }

  __downloadZippedNotes(notes) {
    this.__loadZip(() => {
      zip.createWriter(new zip.BlobWriter("application/zip"), (zipWriter) => {
        var index = 0;

        let nextFile = () => {
          var note = notes[index];
          var blob = new Blob([note.text], {type: 'text/plain'});

          var title = note.title.replace("/", "").replace("\\", "");

          zipWriter.add(`${title}-${note.uuid}.txt`, new zip.BlobReader(blob), () => {
            index++;
            if(index < notes.length) {
              nextFile();
            } else {
              zipWriter.close((blob) => {
                this.__downloadData(blob, `Notes Txt Archive - ${new Date()}.zip`)
                zipWriter = null;
              });
            }
          });
        }

        nextFile();
      }, onerror);
    })
  }


  __hrefForData(data) {
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.textFile !== null) {
      window.URL.revokeObjectURL(this.textFile);
    }

    this.textFile = window.URL.createObjectURL(data);

    // returns a URL you can use as a href
    return this.textFile;
  }

  __downloadData(data, fileName) {
    var link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = this.__hrefForData(data);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }


}

angular.module('app').service('archiveManager', ArchiveManager);
