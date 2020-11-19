import { WebApplication } from '@/ui_models/application';
import { EncryptionIntent, ProtectedAction, SNItem, ContentType, SNNote } from '@standardnotes/snjs';

function zippableTxtName(name: string, suffix = ""): string {
  const sanitizedName = name
      .replace(/\//g, '')
      .replace(/\\+/g, '')
      .replace(/:/g, ' ')
      .replace(/\./g, ' ');
  const nameEnd = suffix + ".txt";
  const maxFileNameLength = 255;
  return sanitizedName.slice(0, maxFileNameLength - nameEnd.length) + nameEnd;
}

export class ArchiveManager {

  private readonly application: WebApplication
  private textFile?: string

  constructor(application: WebApplication) {
    this.application = application;
  }

  public async downloadBackup(encrypted: boolean) {
    const items = this.application.allItems();

    const run = async () => {
      // download in Standard Notes format
      const intent = encrypted
        ? EncryptionIntent.FileEncrypted
        : EncryptionIntent.FileDecrypted;
      if (encrypted) {
        const data = await this.itemsData(items, intent);
        this.downloadData(
          data!,
          `Standard Notes Encrypted Backup and Import File - ${this.formattedDate()}.txt`
        );
      } else {
        /** download as zipped plain text files */
        this.downloadZippedItems(items);
      }
    };

    if (
      await this.application.privilegesService!
        .actionRequiresPrivilege(ProtectedAction.ManageBackups)
    ) {
      this.application.presentPrivilegesModal(
        ProtectedAction.ManageBackups,
        () => {
          run();
        });
    } else {
      run();
    }
  }

  private formattedDate() {
    const string = `${new Date()}`;
    // Match up to the first parenthesis, i.e do not include '(Central Standard Time)'
    const matches = string.match(/^(.*?) \(/);
    if (matches && matches.length >= 2) {
      return matches[1];
    }
    return string;
  }

  private async itemsData(items: SNItem[], intent: EncryptionIntent) {
    const data = await this.application.createBackupFile(items, intent);
    if (!data) {
      return undefined;
    }
    const blobData = new Blob([data], { type: 'text/json' });
    return blobData;
  }

  private get zip() {
    return (window as any).zip;
  }

  private async loadZip() {
    if (this.zip) {
      return;
    }
    const scriptTag = document.createElement('script');
    scriptTag.src = '/assets/zip/zip.js';
    scriptTag.async = false;
    const headTag = document.getElementsByTagName('head')[0];
    headTag.appendChild(scriptTag);
    return new Promise((resolve) => {
      scriptTag.onload = () => {
        this.zip.workerScriptsPath = 'assets/zip/';
        resolve();
      };
    });
  }

  private async downloadZippedItems(
    items: SNItem[]
  ) {
    await this.loadZip();
    this.zip.createWriter(
      new this.zip.BlobWriter('application/zip'),
      async (zipWriter: any) => {

        const data = await this.application.createBackupFile(items, EncryptionIntent.FileDecrypted);
        await new Promise((resolve) => {
          const blob = new Blob([data!], { type: 'text/plain' });
          const fileName = zippableTxtName(
            'Standard Notes Backup and Import File.txt'
          );
          zipWriter.add(fileName, new this.zip.BlobReader(blob), resolve);
        });

        let index = 0;
        const nextFile = () => {
          const item = items[index];
          let name, contents;
          if (item.content_type === ContentType.Note) {
            const note = item as SNNote;
            name = note.title;
            contents = note.text;
          } else {
            name = item.content_type;
            contents = JSON.stringify(item.content, null, 2);
          }
          if (!name) {
            name = '';
          }
          const blob = new Blob([contents], { type: 'text/plain' });
          const fileName = `Items/${item.content_type}/` +
            zippableTxtName(name, `-${item.uuid.split('-')[0]}`);
          zipWriter.add(fileName, new this.zip.BlobReader(blob), () => {
            index++;
            if (index < items.length) {
              nextFile();
            } else {
              zipWriter.close((blob: any) => {
                this.downloadData(
                  blob,
                  `Standard Notes Backup - ${this.formattedDate()}.zip`
                );
                zipWriter = null;
              });
            }
          });
        };
        nextFile();
      }, onerror);
  }

  private hrefForData(data: Blob) {
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.textFile) {
      window.URL.revokeObjectURL(this.textFile);
    }
    this.textFile = window.URL.createObjectURL(data);
    // returns a URL you can use as a href
    return this.textFile;
  }

  private downloadData(data: Blob, fileName: string) {
    const link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = this.hrefForData(data);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
