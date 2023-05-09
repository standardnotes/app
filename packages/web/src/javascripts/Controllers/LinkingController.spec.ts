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
  ItemsClientInterface,
} from '@standardnotes/snjs'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { LinkingController } from './LinkingController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'
import { getLinkingSearchResults } from '@/Utils/Items/Search/getSearchResults'

const createNote = (name: string, options?: Partial<SNNote>) => {
  return {
    title: name,
    archived: false,
    trashed: false,
    uuid: String(Math.random()),
    content_type: ContentType.Note,
    ...options,
  } as jest.Mocked<SNNote>
}

const createFile = (name: string, options?: Partial<FileItem>) => {
  return {
    title: name,
    archived: false,
    trashed: false,
    uuid: String(Math.random()),
    content_type: ContentType.File,
    ...options,
  } as jest.Mocked<FileItem>
}

describe('LinkingController', () => {
  let linkingController: LinkingController
  let application: WebApplication
  let navigationController: NavigationController
  let selectionController: SelectedItemsController
  let eventBus: InternalEventBus

  let itemListController: ItemListController
  let filesController: FilesController
  let subscriptionController: SubscriptionController

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>
    application.getPreference = jest.fn()
    application.addSingleEventObserver = jest.fn()
    application.streamItems = jest.fn()

    Object.defineProperty(application, 'items', { value: {} as jest.Mocked<ItemsClientInterface> })

    navigationController = {} as jest.Mocked<NavigationController>

    selectionController = {} as jest.Mocked<SelectedItemsController>

    eventBus = {} as jest.Mocked<InternalEventBus>

    itemListController = {} as jest.Mocked<ItemListController>
    filesController = {} as jest.Mocked<FilesController>
    subscriptionController = {} as jest.Mocked<SubscriptionController>

    linkingController = new LinkingController(application, navigationController, selectionController, eventBus)
    linkingController.setServicesPostConstruction(itemListController, filesController, subscriptionController)
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
      const activeFile = createNote('test', {
        uuid: 'active-file',
        references: [
          {
            reference_type: ContentReferenceType.FileToNote,
            uuid: 'note-result',
          } as FileToNoteReference,
        ],
      })

      const noteResult = createFile('test', {
        uuid: 'note-result',
        references: [],
      })

      const isNoteResultAlreadyLinked = isSearchResultAlreadyLinkedToItem(noteResult, activeFile)
      expect(isNoteResultAlreadyLinked).toBeTruthy()
    })

    it('should be false if active item & result are different content type & neither references the other', () => {
      const activeFile = createNote('test', {
        uuid: 'active-file',
        references: [],
      })

      const noteResult = createFile('test', {
        uuid: 'note-result',
        references: [],
      })

      const isNoteResultAlreadyLinked = isSearchResultAlreadyLinkedToItem(noteResult, activeFile)
      expect(isNoteResultAlreadyLinked).toBeFalsy()
    })
  })
})
