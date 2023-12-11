import { DecryptedItemInterface, PrefDefaults, PrefKey, SNNote, SNTag, TagContent } from '@standardnotes/models'
import {
  ContentType,
  InternalEventBusInterface,
  ItemManagerInterface,
  MutatorClientInterface,
  PreferenceServiceInterface,
  PreferencesServiceEvent,
  UuidGenerator,
} from '@standardnotes/snjs'
import { ConversionResult, Importer } from '@standardnotes/ui-services'
import { action, makeObservable, observable, runInAction } from 'mobx'
import { NavigationController } from '../../Controllers/Navigation/NavigationController'
import { LinkingController } from '@/Controllers/LinkingController'
import { AbstractViewController } from '@/Controllers/Abstract/AbstractViewController'

type ImportModalFileCommon = {
  id: string
  file: File
  service: string | null | undefined
}

export type ImportModalFile = (
  | { status: 'pending' }
  | { status: 'parsing' }
  | { status: 'importing' }
  | { status: 'uploading-files' }
  | ({ status: 'finished' } & ConversionResult)
  | { status: 'error'; error: Error }
) &
  ImportModalFileCommon

export class ImportModalController extends AbstractViewController {
  isVisible = false
  addImportsToTag = false
  shouldCreateTag = true
  existingTagForImports: SNTag | undefined = undefined
  files: ImportModalFile[] = []
  importTag: SNTag | undefined = undefined

  constructor(
    private importer: Importer,
    private navigationController: NavigationController,
    private items: ItemManagerInterface,
    private mutator: MutatorClientInterface,
    private linkingController: LinkingController,
    private preferences: PreferenceServiceInterface,
    eventBus: InternalEventBusInterface,
  ) {
    super(eventBus)

    makeObservable(this, {
      isVisible: observable,
      setIsVisible: action,

      addImportsToTag: observable,
      setAddImportsToTag: action,

      shouldCreateTag: observable,
      setShouldCreateTag: action,

      existingTagForImports: observable,
      setExistingTagForImports: action,

      files: observable,
      setFiles: action,
      addFiles: action,
      updateFile: action,
      removeFile: action,

      importTag: observable,
      setImportTag: action,
    })

    this.disposers.push(
      preferences.addEventObserver((event) => {
        if (event === PreferencesServiceEvent.PreferencesChanged) {
          runInAction(() => {
            this.addImportsToTag = preferences.getValue(PrefKey.AddImportsToTag, PrefDefaults[PrefKey.AddImportsToTag])
            this.shouldCreateTag = preferences.getValue(
              PrefKey.AlwaysCreateNewTagForImports,
              PrefDefaults[PrefKey.AlwaysCreateNewTagForImports],
            )
            const existingTagUuid = preferences.getValue(PrefKey.ExistingTagForImports)
            this.existingTagForImports = existingTagUuid ? this.items.findItem(existingTagUuid) : undefined
          })
        }
      }),
    )
  }

  setIsVisible = (isVisible: boolean) => {
    this.isVisible = isVisible
  }

  setAddImportsToTag = (addImportsToTag: boolean) => {
    this.preferences.setValue(PrefKey.AddImportsToTag, addImportsToTag).catch(console.error)
  }

  setShouldCreateTag = (shouldCreateTag: boolean) => {
    this.preferences.setValue(PrefKey.AlwaysCreateNewTagForImports, shouldCreateTag).catch(console.error)
  }

  setExistingTagForImports = (tag: SNTag | undefined) => {
    this.preferences.setValue(PrefKey.ExistingTagForImports, tag?.uuid).catch(console.error)
  }

  getImportFromFile = (file: File, service?: string) => {
    return {
      id: UuidGenerator.GenerateUuid(),
      file,
      service,
      status: 'pending',
    } as ImportModalFile
  }

  setFiles = (files: File[], service?: string) => {
    this.files = files.map((file) => this.getImportFromFile(file, service))
  }

  addFiles = (files: File[], service?: string) => {
    this.files = [...this.files, ...files.map((file) => this.getImportFromFile(file, service))]
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

  parseAndImport = async () => {
    if (this.files.length === 0) {
      return
    }
    const importedItems: DecryptedItemInterface[] = []
    for (const file of this.files) {
      if (!file.service) {
        return
      }

      this.updateFile({
        ...file,
        status: 'parsing',
      })

      try {
        const { successful, errored } = await this.importer.importFromFile(file.file, file.service)
        importedItems.push(...successful)
        this.updateFile({
          ...file,
          status: 'finished',
          successful,
          errored,
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
    if (!importedItems.length) {
      return
    }
    if (this.addImportsToTag) {
      const currentDate = new Date()
      let importTag: SNTag | undefined
      if (this.shouldCreateTag) {
        const importTagItem = this.items.createTemplateItem<TagContent, SNTag>(ContentType.TYPES.Tag, {
          title: `Imported on ${currentDate.toLocaleString()}`,
          expanded: false,
          iconString: '',
          references: importedItems
            .filter((payload) => payload.content_type === ContentType.TYPES.Note)
            .map((payload) => ({
              content_type: ContentType.TYPES.Note,
              uuid: payload.uuid,
            })),
        })
        importTag = await this.mutator.insertItem<SNTag>(importTagItem)
      } else if (this.existingTagForImports) {
        try {
          const latestExistingTag = this.items.findSureItem<SNTag>(this.existingTagForImports.uuid)
          await Promise.all(
            importedItems
              .filter((payload) => payload.content_type === ContentType.TYPES.Note)
              .map(async (payload) => {
                const note = this.items.findSureItem<SNNote>(payload.uuid)
                await this.linkingController.addTagToItem(latestExistingTag, note, false)
              }),
          )
          importTag = this.items.findSureItem<SNTag>(this.existingTagForImports.uuid)
        } catch (error) {
          console.error(error)
        }
      }
      if (importTag) {
        this.setImportTag(importTag as SNTag)
      }
    }
  }
}
