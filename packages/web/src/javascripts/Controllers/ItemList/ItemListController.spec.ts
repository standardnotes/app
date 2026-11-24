import { ContentType, Result, SNTag } from '@standardnotes/snjs'
import { InternalEventBus, ItemManagerInterface, ProtectionsClientInterface } from '@standardnotes/services'
import { WebApplication } from '@/Application/WebApplication'
import { NavigationController } from '../Navigation/NavigationController'
import { NotesController } from '../NotesController/NotesController'
import { SearchOptionsController } from '../SearchOptionsController'
import { ItemListController } from './ItemListController'
import { ItemsReloadSource } from './ItemsReloadSource'
import { IsNativeMobileWeb, KeyboardService } from '@standardnotes/ui-services'
import { ListableContentItem } from '@/Components/ContentListView/Types/ListableContentItem'
import { observable, runInAction } from 'mobx'

describe('item list controller', () => {
  let application: WebApplication
  let controller: ItemListController

  beforeEach(() => {
    application = {
      navigationController: {} as jest.Mocked<NavigationController>,
      searchOptionsController: {} as jest.Mocked<SearchOptionsController>,
      notesController: {} as jest.Mocked<NotesController>,
      isNativeMobileWebUseCase: {
        execute: jest.fn().mockReturnValue(Result.ok(false)),
      } as unknown as jest.Mocked<IsNativeMobileWeb>,
      items: {
        streamItems: jest.fn(),
      } as unknown as jest.Mocked<ItemManagerInterface>,
      keyboardService: {
        activeModifiers: new Set(),
      } as unknown as jest.Mocked<KeyboardService>,
      protections: {
        authorizeItemAccess: jest.fn().mockResolvedValue(true),
      } as unknown as jest.Mocked<ProtectionsClientInterface>,
    } as unknown as jest.Mocked<WebApplication>

    application.addEventObserver = jest.fn()
    application.addWebEventObserver = jest.fn()
    application.isNativeMobileWeb = jest.fn().mockReturnValue(false)

    const eventBus = new InternalEventBus()

    controller = new ItemListController(
      application.keyboardService,
      application.paneController,
      application.navigationController,
      application.searchOptionsController,
      application.items,
      application.preferences,
      application.itemControllerGroup,
      application.vaultDisplayService,
      application.desktopManager,
      application.protections,
      application.options,
      application.isNativeMobileWebUseCase,
      application.changeAndSaveItem,
      application.recents,
      eventBus,
    )
  })

  describe('selectItemUsingInstance', () => {
    const item = (contentType: string) =>
      ({ uuid: contentType, content_type: contentType, protected: true }) as unknown as ListableContentItem

    beforeEach(() => {
      controller.replaceSelection = jest.fn()
      controller.openSingleSelectedItem = jest.fn()
    })

    it('opens a protected note without authorizing, since the note view asks for authentication', async () => {
      await controller.selectItemUsingInstance(item(ContentType.TYPES.Note), true)

      expect(application.protections.authorizeItemAccess).not.toHaveBeenCalled()
      expect(controller.openSingleSelectedItem).toHaveBeenCalled()
    })

    it('authorizes a protected file before opening it', async () => {
      application.protections.authorizeItemAccess = jest.fn().mockResolvedValue(false)

      await controller.selectItemUsingInstance(item(ContentType.TYPES.File), true)

      expect(application.protections.authorizeItemAccess).toHaveBeenCalled()
      expect(controller.openSingleSelectedItem).not.toHaveBeenCalled()
    })

    it('authorizes a protected note before adding it to a multiple selection', async () => {
      controller.enableMultipleSelectionMode()
      application.protections.authorizeItemAccess = jest.fn().mockResolvedValue(false)

      await controller.selectItemUsingInstance(item(ContentType.TYPES.Note), true)

      expect(application.protections.authorizeItemAccess).toHaveBeenCalled()
      expect(controller.selectedUuids.has(ContentType.TYPES.Note)).toBe(false)
    })
  })

  describe('shouldSelectFirstItem', () => {
    beforeEach(() => {
      controller.getFirstNonProtectedItem = jest.fn()

      runInAction(() => {
        controller.selectedUuids = observable(new Set<string>())
      })
    })

    it('should return false if platform is native mobile web', () => {
      application.isNativeMobileWebUseCase.execute = jest.fn().mockReturnValue(Result.ok(true))

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

      Object.defineProperty(application.navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(false)
    })

    it('should return true if user triggered tag change', () => {
      const tag = {
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>

      Object.defineProperty(application.navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.UserTriggeredTagChange)).toBe(true)
    })

    it('should return false if not user triggered tag change and there is an existing selected item', () => {
      const tag = {
        content_type: ContentType.TYPES.Tag,
      } as jest.Mocked<SNTag>

      runInAction(() => {
        controller.selectedUuids = observable(new Set(['123']))
      })

      Object.defineProperty(application.navigationController, 'selected', {
        get: () => tag,
      })

      expect(controller.shouldSelectFirstItem(ItemsReloadSource.ItemStream)).toBe(false)
    })

    it('should return true if there are no selected items, even if not user triggered', () => {
      expect(controller.shouldSelectFirstItem(ItemsReloadSource.ItemStream)).toBe(true)
    })
  })
})
