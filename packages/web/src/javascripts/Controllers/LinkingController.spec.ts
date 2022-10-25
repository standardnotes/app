import { WebApplication } from '@/Application/Application'
import {
  ContentType,
  DecryptedPayload,
  FileContent,
  FileItem,
  FillItemContent,
  InternalEventBus,
  PayloadTimestampDefaults,
} from '@standardnotes/snjs'
import { FilesController } from './FilesController'
import { ItemListController } from './ItemList/ItemListController'
import { LinkingController } from './LinkingController'
import { NavigationController } from './Navigation/NavigationController'
import { SelectedItemsController } from './SelectedItemsController'
import { SubscriptionController } from './Subscription/SubscriptionController'

const createFile = (name: string) => {
  return new FileItem(
    new DecryptedPayload({
      uuid: String(Math.random()),
      content_type: ContentType.File,
      content: FillItemContent<FileContent>({
        name: name,
      }),
      ...PayloadTimestampDefaults(),
    }),
  )
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

  it('should be valid result if it matches query even case insensitive', () => {
    const searchQuery = 'test'

    const file = createFile('TeSt')

    const isFileValidResult = linkingController.isValidSearchResult(file, searchQuery)

    expect(isFileValidResult).toBeTruthy()
  })
})
