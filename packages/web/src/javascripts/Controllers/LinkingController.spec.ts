import { isSearchResultAlreadyLinkedToItem } from '@/Utils/Items/Search/isSearchResultAlreadyLinkedToItem'
import { WebApplication } from '@/Application/WebApplication'
import { doesItemMatchSearchQuery } from '@/Utils/Items/Search/doesItemMatchSearchQuery'
import {
  AnonymousReference,
  ContentReferenceType,
  ContentType,
  FileItem,
  FileToNoteReference,
  InternalEventBus,
  SNNote,
  ItemManagerInterface,
  VaultListingInterface,
  ItemInterface,
  InternalFeatureService,
  InternalFeature,
  PreferenceServiceInterface,
  Result,
} from '@standardnotes/snjs'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { LinkingController } from './LinkingController'
import { NavigationController } from './Navigation/NavigationController'
import { SubscriptionController } from './Subscription/SubscriptionController'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'
import { FeaturesController } from './FeaturesController'

const createNote = (name: string, options?: Partial<SNNote>) => {
  return {
    title: name,
    archived: false,
    trashed: false,
    uuid: String(Math.random()),
    content_type: ContentType.TYPES.Note,
    ...options,
  } as jest.Mocked<SNNote>
}

const createFile = (name: string, options?: Partial<FileItem>) => {
  return {
    title: name,
    archived: false,
    trashed: false,
    uuid: String(Math.random()),
    content_type: ContentType.TYPES.File,
    ...options,
  } as jest.Mocked<FileItem>
}

describe('LinkingController', () => {
  let application: WebApplication
  let eventBus: InternalEventBus

  beforeEach(() => {
    application = {
      vaults: {} as jest.Mocked<WebApplication['vaults']>,
      alerts: {} as jest.Mocked<WebApplication['alerts']>,
      sync: {} as jest.Mocked<WebApplication['sync']>,
      mutator: {} as jest.Mocked<WebApplication['mutator']>,
      preferences: {
        getValue: jest.fn().mockReturnValue(true),
      } as unknown as jest.Mocked<PreferenceServiceInterface>,
      itemControllerGroup: {} as jest.Mocked<WebApplication['itemControllerGroup']>,
      navigationController: {} as jest.Mocked<NavigationController>,
      itemListController: {} as jest.Mocked<ItemListController>,
      filesController: {} as jest.Mocked<FilesController>,
      subscriptionController: {} as jest.Mocked<SubscriptionController>,
      featuresController: {} as jest.Mocked<FeaturesController>,
    } as unknown as jest.Mocked<WebApplication>

    application.getPreference = jest.fn()
    application.addSingleEventObserver = jest.fn()
    application.sync.sync = jest.fn()
    application.featuresController.isVaultsEnabled = jest.fn().mockReturnValue(true)
    application.featuresController.isEntitledToSharedVaults = jest.fn().mockReturnValue(true)

    Object.defineProperty(application, 'items', { value: {} as jest.Mocked<ItemManagerInterface> })

    eventBus = {} as jest.Mocked<InternalEventBus>
    eventBus.addEventHandler = jest.fn()

    Object.defineProperty(application, 'linkingController', {
      get: () =>
        new LinkingController(
          application.itemListController,
          application.filesController,
          application.subscriptionController,
          application.navigationController,
          application.featuresController,
          application.itemControllerGroup,
          application.vaultDisplayService,
          application.preferences,
          application.items,
          application.mutator,
          application.sync,
          application.vaults,
          eventBus,
        ),
      configurable: true,
    })
  })

  describe('isValidSearchResult', () => {
    it("should not be valid result if it doesn't match query", () => {
      const searchQuery = 'test'

      const file = createFile('anotherFile')

      const isFileValidResult = doesItemMatchSearchQuery(file, searchQuery, application)

      expect(isFileValidResult).toBeFalsy()
    })

    it('should not be valid result if item is archived or trashed', () => {
      const searchQuery = 'test'

      const archived = createFile('test', { archived: true })

      const trashed = createFile('test', { trashed: true })

      const isArchivedFileValidResult = doesItemMatchSearchQuery(archived, searchQuery, application)
      expect(isArchivedFileValidResult).toBeFalsy()

      const isTrashedFileValidResult = doesItemMatchSearchQuery(trashed, searchQuery, application)
      expect(isTrashedFileValidResult).toBeFalsy()
    })

    it('should not be valid result if result is active item', () => {
      const searchQuery = 'test'

      const activeItem = createFile('test', { uuid: 'same-uuid' })

      application.items.getItems = jest.fn().mockReturnValue([activeItem])

      const results = getLinkingSearchResults(searchQuery, application, activeItem)

      expect([...results.unlinkedItems, ...results.linkedItems]).toHaveLength(0)
    })

    it('should be valid result if it matches query even case insensitive', () => {
      const searchQuery = 'test'

      const file = createFile('TeSt')

      application.items.getItems = jest.fn().mockReturnValue([file])

      const isFileValidResult = doesItemMatchSearchQuery(file, searchQuery, application)

      expect(isFileValidResult).toBeTruthy()
    })
  })

  describe('isSearchResultAlreadyLinkedToItem', () => {
    it('should be true if active item & result are same content type & active item references result', () => {
      const activeItem = createFile('test', {
        uuid: 'active-item',
        references: [
          {
            reference_type: ContentReferenceType.FileToFile,
            uuid: 'result',
          } as AnonymousReference,
        ],
      })
      const result = createFile('test', { uuid: 'result', references: [] })

      const isFileAlreadyLinked = isSearchResultAlreadyLinkedToItem(result, activeItem)
      expect(isFileAlreadyLinked).toBeTruthy()
    })

    it('should be false if active item & result are same content type & result references active item', () => {
      const activeItem = createFile('test', {
        uuid: 'active-item',
        references: [],
      })
      const result = createFile('test', {
        uuid: 'result',
        references: [
          {
            reference_type: ContentReferenceType.FileToFile,
            uuid: 'active-item',
          } as AnonymousReference,
        ],
      })

      const isFileAlreadyLinked = isSearchResultAlreadyLinkedToItem(result, activeItem)
      expect(isFileAlreadyLinked).toBeFalsy()
    })

    it('should be true if active item & result are different content type & result references active item', () => {
      const activeNote = createNote('test', {
        uuid: 'active-note',
        references: [],
      })

      const fileResult = createFile('test', {
        uuid: 'file-result',
        references: [
          {
            reference_type: ContentReferenceType.FileToNote,
            uuid: 'active-note',
          } as FileToNoteReference,
        ],
      })

      const isFileResultAlreadyLinked = isSearchResultAlreadyLinkedToItem(fileResult, activeNote)
      expect(isFileResultAlreadyLinked).toBeTruthy()
    })

    it('should be true if active item & result are different content type & active item references result', () => {
      const activeNote = createNote('test', {
        uuid: 'active-note',
        references: [
          {
            reference_type: ContentReferenceType.FileToNote,
            uuid: 'file-result',
          } as FileToNoteReference,
        ],
      })

      const fileResult = createFile('test', {
        uuid: 'file-result',
        references: [],
      })

      const isNoteResultAlreadyLinked = isSearchResultAlreadyLinkedToItem(fileResult, activeNote)
      expect(isNoteResultAlreadyLinked).toBeTruthy()
    })

    it('should be false if active item & result are different content type & neither references the other', () => {
      const activeNote = createNote('test', {
        uuid: 'active-file',
        references: [],
      })

      const fileResult = createFile('test', {
        uuid: 'note-result',
        references: [],
      })

      const isNoteResultAlreadyLinked = isSearchResultAlreadyLinkedToItem(fileResult, activeNote)
      expect(isNoteResultAlreadyLinked).toBeFalsy()
    })
  })

  describe('linkItems', () => {
    it('should move file to same vault as note if file does not belong to any vault', async () => {
      InternalFeatureService.get().enableFeature(InternalFeature.Vaults)

      application.mutator.associateFileWithNote = jest.fn().mockReturnValue({})

      const moveToVaultSpy = (application.vaults.moveItemToVault = jest.fn().mockReturnValue(Result.ok()))

      const note = createNote('test', {
        uuid: 'note',
        references: [],
      })

      const file = createFile('test', {
        uuid: 'file',
        references: [],
      })

      const noteVault = {
        uuid: 'note-vault',
      } as jest.Mocked<VaultListingInterface>

      application.vaults.getItemVault = jest.fn().mockImplementation((item: ItemInterface) => {
        if (item.uuid === note.uuid) {
          return noteVault
        }
        return undefined
      })

      await application.linkingController.linkItems(note, file)

      expect(moveToVaultSpy).toHaveBeenCalled()
    })
  })
})
