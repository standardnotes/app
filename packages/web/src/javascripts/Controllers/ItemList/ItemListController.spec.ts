import { SNTag } from '@standardnotes/snjs'
import { ContentType } from '@standardnotes/common'
import { InternalEventBus } from '@standardnotes/services'
import { WebApplication } from '@/Application/Application'
import { LinkingController } from '../LinkingController'
import { NavigationController } from '../Navigation/NavigationController'
import { NotesController } from '../NotesController/NotesController'
import { SearchOptionsController } from '../SearchOptionsController'
import { SelectedItemsController } from '../SelectedItemsController'
import { ItemListController } from './ItemListController'
import { ItemsReloadSource } from './ItemsReloadSource'

describe('item list controller', () => {
  let controller: ItemListController
  let navigationController: NavigationController
  let selectionController: SelectedItemsController

  beforeEach(() => {
    const application = {} as jest.Mocked<WebApplication>
    application.streamItems = jest.fn()
    application.addEventObserver = jest.fn()
    application.addWebEventObserver = jest.fn()

    navigationController = {} as jest.Mocked<NavigationController>
    selectionController = {} as jest.Mocked<SelectedItemsController>

    const searchOptionsController = {} as jest.Mocked<SearchOptionsController>
    const notesController = {} as jest.Mocked<NotesController>
    const linkingController = {} as jest.Mocked<LinkingController>
    const eventBus = new InternalEventBus()

    controller = new ItemListController(
      application,
      navigationController,
      searchOptionsController,
      selectionController,
      notesController,
      linkingController,
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

    it('should return false first item is file', () => {
      controller.getFirstNonProtectedItem = jest.fn().mockReturnValue({
        content_type: ContentType.File,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(false)
    })

    it('should return false if selected tag is daily entry', () => {
      const tag = {
        isDailyEntry: true,
        content_type: ContentType.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(false)
    })

    it('should return true if user triggered tag change', () => {
      const tag = {
        content_type: ContentType.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(true)
    })

    it('should return false if not user triggered tag change and there is an existing selected item', () => {
      const tag = {
        content_type: ContentType.Tag,
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
