import { WebApplication } from '@/ui_models/application';
import { parseFileName } from '@standardnotes/filepicker';
import {
  EncryptionIntent,
  ContentType,
  SNNote,
  BackupFile,
  PayloadContent,
} from '@standardnotes/snjs';

function sanitizeFileName(name: string): string {
  return name.trim().replace(/[.\\/:"?*|<>]/g, '_');
}

function zippableFileName(name: string, suffix = '', format = 'txt'): string {
  const sanitizedName = sanitizeFileName(name);
  const nameEnd = suffix + '.' + format;
  const maxFileNameLength = 100;
  return sanitizedName.slice(0, maxFileNameLength - nameEnd.length) + nameEnd;
}

type ZippableData = {
  filename: string;
  content: Blob;
}[];

export class ArchiveManager {
  private readonly application: WebApplication;
  private textFile?: string;

  constructor(application: WebApplication) {
    this.application = application;
  }

  public async downloadBackup(encrypted: boolean): Promise<void> {
    const intent = encrypted
      ? EncryptionIntent.FileEncrypted
      : EncryptionIntent.FileDecrypted;

    const data = await this.application.createBackupFile(intent, true);
    if (!data) {
      return;
    }
    const blobData = new Blob([JSON.stringify(data, null, 2)], {
      type: 'text/json',
    });
    if (encrypted) {
      this.downloadData(
        blobData,
        `Standard Notes Encrypted Backup and Import File - ${this.formattedDate()}.txt`
      );
    } else {
      this.downloadZippedDecryptedItems(data);
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
    return new Promise<void>((resolve) => {
      scriptTag.onload = () => {
        this.zip.workerScriptsPath = 'assets/zip/';
        resolve();
      };
    });
  }

  private async downloadZippedDecryptedItems(data: BackupFile) {
    await this.loadZip();
    const items = data.items;
    this.zip.createWriter(
      new this.zip.BlobWriter('application/zip'),
      async (zipWriter: any) => {
        await new Promise((resolve) => {
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'text/plain',
          });
          const fileName = zippableFileName(
            'Standard Notes Backup and Import File'
          );
          zipWriter.add(fileName, new this.zip.BlobReader(blob), resolve);
        });

        let index = 0;
        const nextFile = () => {
          const item = items[index];
          let name, contents;
          if (item.content_type === ContentType.Note) {
            const note = item as SNNote;
            name = (note.content as PayloadContent).title;
            contents = (note.content as PayloadContent).text;
          } else {
            name = item.content_type;
            contents = JSON.stringify(item.content, null, 2);
          }
          if (!name) {
            name = '';
          }
          const blob = new Blob([contents], { type: 'text/plain' });
          const fileName =
            `Items/${sanitizeFileName(item.content_type)}/` +
            zippableFileName(name, `-${item.uuid.split('-')[0]}`);
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
      },
      onerror
    );
  }

  async zipData(data: ZippableData): Promise<Blob> {
    const zip = await import('@zip.js/zip.js');
    const writer = new zip.ZipWriter(new zip.BlobWriter('application/zip'));

    for (let i = 0; i < data.length; i++) {
      const { name, ext } = parseFileName(data[i].filename);
      await writer.add(
        zippableFileName(name, '', ext),
        new zip.BlobReader(data[i].content)
      );
    }

    const zipFileAsBlob = await writer.close();

    return zipFileAsBlob;
  }

  async downloadDataAsZip(data: ZippableData) {
    const zipFileAsBlob = await this.zipData(data);
    this.downloadData(
      zipFileAsBlob,
      `Standard Notes Export - ${this.formattedDate()}.zip`
    );
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

  downloadData(data: Blob, fileName: string) {
    const link = document.createElement('a');
    link.setAttribute('download', fileName);
    link.href = this.hrefForData(data);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
