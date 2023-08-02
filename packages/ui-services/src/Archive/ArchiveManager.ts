import { parseFileName } from '@standardnotes/filepicker'
import {
  BackupFile,
  BackupFileDecryptedContextualPayload,
  EncryptedItemInterface,
  NoteContent,
} from '@standardnotes/models'
import { ContentType } from '@standardnotes/domain-core'
import { ApplicationInterface } from '@standardnotes/services'

export function sanitizeFileName(name: string): string {
  return name.trim().replace(/[.\\/:"?*|<>]/g, '_')
}

function zippableFileName(name: string, suffix = '', format = 'txt'): string {
  const sanitizedName = sanitizeFileName(name)
  const nameEnd = suffix + '.' + format
  const maxFileNameLength = 100
  return sanitizedName.slice(0, maxFileNameLength - nameEnd.length) + nameEnd
}

type ZippableData = {
  name: string
  content: Blob
}[]

type ObjectURL = string

export class ArchiveManager {
  private readonly application: ApplicationInterface
  private textFile?: string

  constructor(application: ApplicationInterface) {
    this.application = application
  }

  public async getMimeType(ext: string) {
    return (await import('@zip.js/zip.js')).getMimeType(ext)
  }

  public async downloadBackup(encrypted: boolean): Promise<void> {
    const data = encrypted
      ? await this.application.createEncryptedBackupFile()
      : await this.application.createDecryptedBackupFile()

    if (!data) {
      return
    }

    const blobData = new Blob([JSON.stringify(data, null, 2)], {
      type: 'text/json',
    })

    if (encrypted) {
      this.downloadData(
        blobData,
        `Standard Notes Encrypted Backup and Import File - ${this.formattedDateForExports()}.txt`,
      )
    } else {
      this.downloadZippedDecryptedItems(data).catch(console.error)
    }
  }

  formattedDateForExports() {
    const string = new Date().toString()
    // Match up to the first parenthesis, i.e do not include '(Central Standard Time)'
    const matches = string.match(/^(.*?) \(/)
    if (matches && matches.length >= 2) {
      return matches[1]
    }
    return string
  }

  async getZippedDecryptedItemsBlob(data: BackupFile) {
    const zip = await import('@zip.js/zip.js')
    const zipWriter = new zip.ZipWriter<Blob>(new zip.BlobWriter('application/zip'))
    const items = data.items

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'text/plain',
    })

    const fileName = zippableFileName('Standard Notes Backup and Import File')
    await zipWriter.add(fileName, new zip.BlobReader(blob))

    for (let index = 0; index < items.length; index++) {
      const item = items[index]
      let name, contents

      if (item.content_type === ContentType.TYPES.Note) {
        const note = item as BackupFileDecryptedContextualPayload<NoteContent>
        name = note.content.title
        contents = note.content.text
      } else {
        name = item.content_type
        contents = JSON.stringify(item.content, null, 2)
      }

      if (!name) {
        name = ''
      }

      const blob = new Blob([contents], { type: 'text/plain' })
      const fileName =
        `Items/${sanitizeFileName(item.content_type)}/` + zippableFileName(name, `-${item.uuid.split('-')[0]}`)
      await zipWriter.add(fileName, new zip.BlobReader(blob))
    }

    return await zipWriter.close()
  }

  private async downloadZippedDecryptedItems(data: BackupFile) {
    const zippedDecryptedItemsBlob = await this.getZippedDecryptedItemsBlob(data)
    this.downloadData(zippedDecryptedItemsBlob, `Standard Notes Backup - ${this.formattedDateForExports()}.zip`)
  }

  async zipData(data: ZippableData): Promise<Blob> {
    const zip = await import('@zip.js/zip.js')
    const writer = new zip.ZipWriter<Blob>(new zip.BlobWriter('application/zip'))

    const filenameCounts: Record<string, number> = {}

    for (let i = 0; i < data.length; i++) {
      const file = data[i]

      const { name, ext } = parseFileName(file.name)

      filenameCounts[file.name] = filenameCounts[file.name] == undefined ? 0 : filenameCounts[file.name] + 1

      const currentFileNameIndex = filenameCounts[file.name]

      await writer.add(
        zippableFileName(name, currentFileNameIndex > 0 ? ` - ${currentFileNameIndex}` : '', ext),
        new zip.BlobReader(file.content),
      )
    }

    const zipFileAsBlob = await writer.close()

    return zipFileAsBlob
  }

  async downloadDataAsZip(data: ZippableData) {
    const zipFileAsBlob = await this.zipData(data)
    this.downloadData(zipFileAsBlob, `Standard Notes Export - ${this.formattedDateForExports()}.zip`)
  }

  private hrefForData(data: Blob) {
    // If we are replacing a previously generated file we need to
    // manually revoke the object URL to avoid memory leaks.
    if (this.textFile) {
      window.URL.revokeObjectURL(this.textFile)
    }
    this.textFile = window.URL.createObjectURL(data)
    // returns a URL you can use as a href
    return this.textFile
  }

  downloadData(data: Blob | ObjectURL, fileName: string): void {
    const link = document.createElement('a')
    link.setAttribute('download', fileName)
    link.href = typeof data === 'string' ? data : this.hrefForData(data)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  downloadEncryptedItem(item: EncryptedItemInterface) {
    this.downloadData(new Blob([JSON.stringify(item.payload.ejected())]), `${item.uuid}.txt`)
  }

  downloadEncryptedItems(items: EncryptedItemInterface[]) {
    const data = JSON.stringify(items.map((i) => i.payload.ejected()))
    this.downloadData(new Blob([data]), 'errored-items.txt')
  }
}
