import { ContentType, SNTag } from '@standardnotes/snjs'
import { InternalEventBus } from '@standardnotes/services'
import { WebApplication } from '@/Application/WebApplication'
import { NavigationController } from '../Navigation/NavigationController'
import { NotesController } from '../NotesController/NotesController'
import { SearchOptionsController } from '../SearchOptionsController'
import { SelectedItemsController } from '../SelectedItemsController'
import { ItemListController } from './ItemListController'
import { ItemsReloadSource } from './ItemsReloadSource'

describe('item list controller', () => {
  let application: WebApplication
  let controller: ItemListController
  let navigationController: NavigationController
  let selectionController: SelectedItemsController

  beforeEach(() => {
    application = {} as jest.Mocked<WebApplication>
    application.streamItems = jest.fn()
    application.addEventObserver = jest.fn()
    application.addWebEventObserver = jest.fn()
    application.isNativeMobileWeb = jest.fn().mockReturnValue(false)

    navigationController = {} as jest.Mocked<NavigationController>
    selectionController = {} as jest.Mocked<SelectedItemsController>

    const searchOptionsController = {} as jest.Mocked<SearchOptionsController>
    const notesController = {} as jest.Mocked<NotesController>
    const eventBus = new InternalEventBus()

    controller = new ItemListController(
      application,
      navigationController,
      searchOptionsController,
      selectionController,
      notesController,
      eventBus,
    )
  })

  describe('shouldSelectFirstItem', () => {
    beforeEach(() => {
      controller.getFirstNonProtectedItem = jest.fn()

      Object.defineProperty(selectionController, 'selectedUuids', {
        get: () => new Set(),
        configurable: true,
      })
    })

    it('should return false is platform is native mobile web', () => {
      application.isNativeMobileWeb = jest.fn().mockReturnValue(true)

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.TagChange)).toBe(false)
    })

    it('should return false first item is file', () => {
      controller.getFirstNonProtectedItem = jest.fn().mockReturnValue({
        content_type: ContentType.TYPES.File,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(false)
    })

    it('should return false if selected tag is daily entry', () => {
      const tag = {
        isDailyEntry: true,
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(false)
    })

    it('should return true if user triggered tag change', () => {
      const tag = {
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(true)
    })

    it('should return false if not user triggered tag change and there is an existing selected item', () => {
      const tag = {
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(selectionController, 'selectedUuids', {
        get: () => new Set(['123']),
      })

      Object.defineProperty(navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.ItemStream)).toBe(false)
    })

    it('should return true if there are no selected items, even if not user triggered', () => {
      expect(controller.shouldSelectFirstItem(ItemsReloadSource.ItemStream)).toBe(true)
    })
  })
})
