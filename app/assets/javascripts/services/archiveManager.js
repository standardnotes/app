import { EncryptionIntents, ProtectedAction } from 'snjs';

export class ArchiveManager {
  constructor(application) {
    this.application = application;
  }

  /** @public */
  async downloadBackup(encrypted) {
    return this.downloadBackupOfItems(this.application.modelManager.allItems, encrypted);
  }

  /** @public */
  async downloadBackupOfItems(items, encrypted) {
    const run = async () => {
      // download in Standard Notes format
      const intent = encrypted
        ? EncryptionIntents.FileEncrypted
        : EncryptionIntents.FileDecrypted;
      this.itemsData(items, intent).then((data) => {
        const modifier = encrypted ? "Encrypted" : "Decrypted";
        this.downloadData(
          data,
          `Standard Notes ${modifier} Backup - ${this.formattedDate()}.txt`
        );
        // download as zipped plain text files
        if (!encrypted) {
          this.downloadZippedItems(items);
        }
      });
    };

    if (await this.application.privilegesService.actionRequiresPrivilege(ProtectedAction.ManageBackups)) {
      this.application.presentPrivilegesModal(ProtectedAction.ManageBackups, () => {
        run();
      });
    } else {
      run();
    }
  }

  /** @private */
  formattedDate() {
    var string = `${new Date()}`;
    // Match up to the first parenthesis, i.e do not include '(Central Standard Time)'
    var matches = string.match(/^(.*?) \(/);
    if (matches.length >= 2) {
      return matches[1];
    }
    return string;
  }

  /** @private */
  async itemsData(items, intent) {
    const data = await this.application.createBackupFile({
      subItems: items,
      intent: intent
    });
    const blobData = new Blob([data], { type: 'text/json' });
    return blobData;
  }

  /** @private */
  async loadZip() {
    if (window.zip) {
      return;
    }

    var scriptTag = document.createElement('script');
    scriptTag.src = "/assets/zip/zip.js";
    scriptTag.async = false;
    var headTag = document.getElementsByTagName('head')[0];
    headTag.appendChild(scriptTag);
    return new Promise((resolve, reject) => {
      scriptTag.onload = function () {
        zip.workerScriptsPath = "assets/zip/";
        resolve();
      };
    });
  }

  /** @private */
  async downloadZippedItems(items) {
    await this.loadZip();
    zip.createWriter(new zip.BlobWriter("application/zip"), (zipWriter) => {
      var index = 0;

      const nextFile = () => {
        var item = items[index];
        var name, contents;

        if (item.content_type === "Note") {
          name = item.content.title;
          contents = item.content.text;
        } else {
          name = item.content_type;
          contents = JSON.stringify(item.content, null, 2);
        }

        if (!name) {
          name = "";
        }

        const blob = new Blob([contents], { type: 'text/plain' });
        let filePrefix = name.replace(/\//g, "").replace(/\\+/g, "");
        const fileSuffix = `-${item.uuid.split("-")[0]}.txt`;
        // Standard max filename length is 255. Slice the note name down to allow filenameEnd
        filePrefix = filePrefix.slice(0, (255 - fileSuffix.length));
        const fileName = `${item.content_type}/${filePrefix}${fileSuffix}`;
        zipWriter.add(fileName, new zip.BlobReader(blob), () => {
          index++;
          if (index < items.length) {
            nextFile();
          } else {
            zipWriter.close((blob) => {
              this.downloadData(blob, `Standard Notes Backup - ${this.formattedDate()}.zip`);
              zipWriter = null;
            });
          }
        });
      };

      nextFile();
    }, onerror);
  }


  /** @private */
  hrefForData(data) {
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.textFile !== null) {
      window.URL.revokeObjectURL(this.textFile);
    }
    this.textFile = window.URL.createObjectURL(data);
    // returns a URL you can use as a href
    return this.textFile;
  }

  /** @private */
  downloadData(data, fileName) {
    var link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = this.hrefForData(data);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
