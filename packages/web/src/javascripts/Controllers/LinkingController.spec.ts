import { WebApplication } from '@/Application/Application'
import { FileItem, InternalEventBus } from '@standardnotes/snjs'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { LinkingController } from './LinkingController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'

const createFile = (name: string, archived = false, trashed = false, uuid?: string) => {
  return {
    title: name,
    archived,
    trashed,
    uuid: uuid ? uuid : String(Math.random()),
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

    navigationController = {} as jest.Mocked<NavigationController>

    selectionController = {} as jest.Mocked<SelectedItemsController>

    eventBus = {} as jest.Mocked<InternalEventBus>

    itemListController = {} as jest.Mocked<ItemListController>
    filesController = {} as jest.Mocked<FilesController>
    subscriptionController = {} as jest.Mocked<SubscriptionController>

    linkingController = new LinkingController(application, navigationController, selectionController, eventBus)
    linkingController.setServicesPostConstruction(itemListController, filesController, subscriptionController)
  })

  it("should not be valid result if it doesn't match query", () => {
    const searchQuery = 'test'

    const file = createFile('anotherFile')

    const isFileValidResult = linkingController.isValidSearchResult(file, searchQuery)

    expect(isFileValidResult).toBeFalsy()
  })

  it('should not be valid result if item is archived or trashed', () => {
    const searchQuery = 'test'

    const archived = createFile('test', true)

    const trashed = createFile('test', false, true)

    const isArchivedFileValidResult = linkingController.isValidSearchResult(archived, searchQuery)
    expect(isArchivedFileValidResult).toBeFalsy()

    const isTrashedFileValidResult = linkingController.isValidSearchResult(trashed, searchQuery)
    expect(isTrashedFileValidResult).toBeFalsy()
  })

  it('should not be valid result if result is active item', () => {
    const searchQuery = 'test'

    const activeItem = createFile('test', false, false, 'same-uuid')

    Object.defineProperty(itemListController, 'activeControllerItem', { value: activeItem })

    const result = createFile('test', false, false, 'same-uuid')

    const isFileValidResult = linkingController.isValidSearchResult(result, searchQuery)
    expect(isFileValidResult).toBeFalsy()
  })

  it('should be valid result if it matches query even case insensitive', () => {
    const searchQuery = 'test'

    const file = createFile('TeSt')

    const isFileValidResult = linkingController.isValidSearchResult(file, searchQuery)

    expect(isFileValidResult).toBeTruthy()
  })
})
