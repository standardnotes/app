import { WebApplication } from '@/Application/WebApplication'
import { DecryptedTransferPayload, SNTag, TagContent } from '@standardnotes/models'
import { ContentType, pluralize, UuidGenerator } from '@standardnotes/snjs'
import { Importer, NoteImportType } from '@standardnotes/ui-services'
import { action, makeObservable, observable } from 'mobx'
import { NavigationController } from './Navigation/NavigationController'

type ImportModalFileCommon = {
  id: string
  file: File
  service: NoteImportType | null | undefined
}

export type ImportModalFile = (
  | { status: 'pending' }
  | { status: 'ready'; payloads?: DecryptedTransferPayload[] }
  | { status: 'parsing' }
  | { status: 'importing' }
  | { status: 'success'; successMessage: string }
  | { status: 'error'; error: Error }
) &
  ImportModalFileCommon

export class ImportModalController {
  isVisible = false
  importer: Importer
  files: ImportModalFile[] = []
  importTag: SNTag | undefined = undefined

  constructor(private application: WebApplication, private navigationController: NavigationController) {
    makeObservable(this, {
      isVisible: observable,
      setIsVisible: action,

      files: observable,
      setFiles: action,
      updateFile: action,
      removeFile: action,

      importTag: observable,
      setImportTag: action,
    })

    this.importer = new Importer(application)
  }

  setIsVisible = (isVisible: boolean) => {
    this.isVisible = isVisible
  }

  setFiles = (files: File[], service?: NoteImportType) => {
    this.files = files.map((file) => ({
      id: UuidGenerator.GenerateUuid(),
      file,
      service,
      status: service ? 'ready' : 'pending',
    }))
  }

  updateFile = (file: ImportModalFile) => {
    this.files = this.files.map((f) => (f.id === file.id ? file : f))
  }

  removeFile = (id: ImportModalFile['id']) => {
    this.files = this.files.filter((f) => f.id !== id)
  }

  setImportTag = (tag: SNTag | undefined) => {
    this.importTag = tag
  }

  close = () => {
    this.setIsVisible(false)
    if (this.importTag) {
      this.navigationController
        .setSelectedTag(this.importTag, 'all', {
          userTriggered: true,
        })
        .catch(console.error)
    }
    this.setFiles([])
    this.setImportTag(undefined)
  }

  importFromPayloads = async (file: ImportModalFile, payloads: DecryptedTransferPayload[]) => {
    this.updateFile({
      ...file,
      status: 'importing',
    })

    try {
      await this.importer.importFromTransferPayloads(payloads)

      const notesImported = payloads.filter((payload) => payload.content_type === ContentType.Note)
      const tagsImported = payloads.filter((payload) => payload.content_type === ContentType.Tag)

      const successMessage =
        `Successfully imported ${notesImported.length} ` +
        pluralize(notesImported.length, 'note', 'notes') +
        (tagsImported.length > 0 ? ` and ${tagsImported.length} ${pluralize(tagsImported.length, 'tag', 'tags')}` : '')

      this.updateFile({
        ...file,
        status: 'success',
        successMessage,
      })
    } catch (error) {
      this.updateFile({
        ...file,
        status: 'error',
        error: error instanceof Error ? error : new Error('Could not import file'),
      })
      console.error(error)
    }
  }

  parseAndImport = async () => {
    if (this.files.length === 0) {
      return
    }
    const importedPayloads: DecryptedTransferPayload[] = []
    for (const file of this.files) {
      if (!file.service) {
        return
      }

      if (file.status === 'ready' && file.payloads) {
        await this.importFromPayloads(file, file.payloads)
        importedPayloads.push(...file.payloads)
        continue
      }

      this.updateFile({
        ...file,
        status: 'parsing',
      })

      try {
        const payloads = await this.importer.getPayloadsFromFile(file.file, file.service)
        await this.importFromPayloads(file, payloads)
        importedPayloads.push(...payloads)
      } catch (error) {
        this.updateFile({
          ...file,
          status: 'error',
          error: error instanceof Error ? error : new Error('Could not import file'),
        })
        console.error(error)
      }
    }
    const currentDate = new Date()
    const importTagItem = this.application.mutator.createTemplateItem<TagContent, SNTag>(ContentType.Tag, {
      title: `Imported on ${currentDate.toLocaleString()}`,
      expanded: false,
      iconString: '',
      references: importedPayloads
        .filter((payload) => payload.content_type === ContentType.Note)
        .map((payload) => ({
          content_type: ContentType.Note,
          uuid: payload.uuid,
        })),
    })
    const importTag = await this.application.mutator.insertItem(importTagItem)
    if (importTag) {
      this.setImportTag(importTag as SNTag)
    }
  }
}
