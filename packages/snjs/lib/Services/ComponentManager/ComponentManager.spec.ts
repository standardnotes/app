/**
 * @jest-environment jsdom
 */

import { SNPreferencesService } from '../Preferences/PreferencesService'
import { createNote, createNoteWithTitle } from './../../Spec/SpecUtils'
import {
  ComponentAction,
  ComponentPermission,
  FeatureDescription,
  FindNativeFeature,
  FeatureIdentifier,
  NoteType,
} from '@standardnotes/features'
import { ContentType } from '@standardnotes/common'
import { GenericItem, SNComponent, Environment, Platform } from '@standardnotes/models'
import { DesktopManagerInterface, InternalEventBusInterface, AlertService } from '@standardnotes/services'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SNComponentManager } from './ComponentManager'
import { SNSyncService } from '../Sync/SyncService'

describe('featuresService', () => {
  let itemManager: ItemManager
  let featureService: SNFeaturesService
  let alertService: AlertService
  let syncService: SNSyncService
  let prefsService: SNPreferencesService
  let internalEventBus: InternalEventBusInterface

  const desktopExtHost = 'http://localhost:123'

  const createManager = (environment: Environment, platform: Platform) => {
    const desktopManager: DesktopManagerInterface = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      syncComponentsInstallation() {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      registerUpdateObserver(_callback: (component: SNComponent) => void) {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {}
      },
      getExtServerHost() {
        return desktopExtHost
      },
    }

    const manager = new SNComponentManager(
      itemManager,
      syncService,
      featureService,
      prefsService,
      alertService,
      environment,
      platform,
      internalEventBus,
    )
    manager.setDesktopManager(desktopManager)
    return manager
  }

  beforeEach(() => {
    syncService = {} as jest.Mocked<SNSyncService>
    syncService.sync = jest.fn()

    itemManager = {} as jest.Mocked<ItemManager>
    itemManager.getItems = jest.fn().mockReturnValue([])
    itemManager.createItem = jest.fn()
    itemManager.changeComponent = jest.fn().mockReturnValue({} as jest.Mocked<GenericItem>)
    itemManager.setItemsToBeDeleted = jest.fn()
    itemManager.addObserver = jest.fn()
    itemManager.changeItem = jest.fn()
    itemManager.changeFeatureRepo = jest.fn()

    featureService = {} as jest.Mocked<SNFeaturesService>

    prefsService = {} as jest.Mocked<SNPreferencesService>

    alertService = {} as jest.Mocked<AlertService>
    alertService.confirm = jest.fn()
    alertService.alert = jest.fn()

    internalEventBus = {} as jest.Mocked<InternalEventBusInterface>
    internalEventBus.publish = jest.fn()
  })

  const nativeComponent = (identifier?: FeatureIdentifier, file_type?: FeatureDescription['file_type']) => {
    return new SNComponent({
      uuid: '789',
      content_type: ContentType.Component,
      content: {
        package_info: {
          hosted_url: 'https://example.com/component',
          identifier: identifier || FeatureIdentifier.PlusEditor,
          file_type: file_type ?? 'html',
          valid_until: new Date(),
        },
      },
    } as never)
  }

  const deprecatedComponent = () => {
    return new SNComponent({
      uuid: '789',
      content_type: ContentType.Component,
      content: {
        package_info: {
          hosted_url: 'https://example.com/component',
          identifier: FeatureIdentifier.DeprecatedFileSafe,
          valid_until: new Date(),
        },
      },
    } as never)
  }

  const thirdPartyComponent = () => {
    return new SNComponent({
      uuid: '789',
      content_type: ContentType.Component,
      content: {
        local_url: 'sn://Extensions/non-native-identifier/dist/index.html',
        hosted_url: 'https://example.com/component',
        package_info: {
          identifier: 'non-native-identifier',
          valid_until: new Date(),
        },
      },
    } as never)
  }

  describe('permissions', () => {
    it('editor should be able to to stream single note', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamContextItem,
          content_types: [ContentType.Note],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(nativeComponent(FeatureIdentifier.MarkdownVisualEditor), permissions),
      ).toEqual(true)
    })

    it('no extension should be able to stream multiple notes', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Note],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(manager.areRequestedPermissionsValid(nativeComponent(), permissions)).toEqual(false)
    })

    it('no extension should be able to stream multiple tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Tag],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(manager.areRequestedPermissionsValid(nativeComponent(), permissions)).toEqual(false)
    })

    it('no extension should be able to stream multiple notes or tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Tag, ContentType.Note],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(manager.areRequestedPermissionsValid(nativeComponent(), permissions)).toEqual(false)
    })

    it('some valid and some invalid permissions should still return invalid permissions', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Tag, ContentType.FilesafeFileMetadata],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(nativeComponent(FeatureIdentifier.DeprecatedFileSafe), permissions),
      ).toEqual(false)
    })

    it('filesafe should be able to stream its files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.FilesafeFileMetadata,
            ContentType.FilesafeCredentials,
            ContentType.FilesafeIntegration,
          ],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(nativeComponent(FeatureIdentifier.DeprecatedFileSafe), permissions),
      ).toEqual(true)
    })

    it('bold editor should be able to stream filesafe files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.FilesafeFileMetadata,
            ContentType.FilesafeCredentials,
            ContentType.FilesafeIntegration,
          ],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(nativeComponent(FeatureIdentifier.DeprecatedBoldEditor), permissions),
      ).toEqual(true)
    })

    it('non bold editor should not able to stream filesafe files', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [
            ContentType.FilesafeFileMetadata,
            ContentType.FilesafeCredentials,
            ContentType.FilesafeIntegration,
          ],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(manager.areRequestedPermissionsValid(nativeComponent(FeatureIdentifier.PlusEditor), permissions)).toEqual(
        false,
      )
    })
  })

  describe('urlForComponent', () => {
    describe('desktop', () => {
      it('returns native path for native component', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = nativeComponent()
        const url = manager.urlForComponent(component)
        const feature = FindNativeFeature(component.identifier)
        expect(url).toEqual(`${desktopExtHost}/components/${feature?.identifier}/${feature?.index_path}`)
      })

      it('returns native path for deprecated native component', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = deprecatedComponent()
        const url = manager.urlForComponent(component)
        const feature = FindNativeFeature(component.identifier)
        expect(url).toEqual(`${desktopExtHost}/components/${feature?.identifier}/${feature?.index_path}`)
      })

      it('returns nonnative path for third party component', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = thirdPartyComponent()
        const url = manager.urlForComponent(component)
        expect(url).toEqual(`${desktopExtHost}/Extensions/${component.identifier}/dist/index.html`)
      })

      it('returns hosted url for third party component with no local_url', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = new SNComponent({
          uuid: '789',
          content_type: ContentType.Component,
          content: {
            hosted_url: 'https://example.com/component',
            package_info: {
              identifier: 'non-native-identifier',
              valid_until: new Date(),
            },
          },
        } as never)
        const url = manager.urlForComponent(component)
        expect(url).toEqual('https://example.com/component')
      })
    })

    describe('web', () => {
      it('returns native path for native component', () => {
        const manager = createManager(Environment.Web, Platform.MacWeb)
        const component = nativeComponent()
        const url = manager.urlForComponent(component)
        const feature = FindNativeFeature(component.identifier) as FeatureDescription
        expect(url).toEqual(`http://localhost/components/assets/${component.identifier}/${feature.index_path}`)
      })

      it('returns hosted path for third party component', () => {
        const manager = createManager(Environment.Web, Platform.MacWeb)
        const component = thirdPartyComponent()
        const url = manager.urlForComponent(component)
        expect(url).toEqual(component.hosted_url)
      })
    })
  })

  describe('editors', () => {
    it('getEditorForNote should return undefined is note type is plain', () => {
      const note = createNote({
        noteType: NoteType.Plain,
      })
      const manager = createManager(Environment.Web, Platform.MacWeb)

      expect(manager.editorForNote(note)).toBe(undefined)
    })

    it('getEditorForNote should call legacy function if no note editorIdentifier or noteType', () => {
      const note = createNote({})
      const manager = createManager(Environment.Web, Platform.MacWeb)
      manager['legacyGetEditorForNote'] = jest.fn()
      manager.editorForNote(note)

      expect(manager['legacyGetEditorForNote']).toHaveBeenCalled()
    })
  })

  describe('editor change alert', () => {
    it('should not require alert switching from plain editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const component = nativeComponent()
      const requiresAlert = manager.doesEditorChangeRequireAlert(undefined, component)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching to plain editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const component = nativeComponent()
      const requiresAlert = manager.doesEditorChangeRequireAlert(component, undefined)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching from a markdown editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = nativeComponent()
      const markdownEditor = nativeComponent(undefined, 'md')
      const requiresAlert = manager.doesEditorChangeRequireAlert(markdownEditor, htmlEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching to a markdown editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = nativeComponent()
      const markdownEditor = nativeComponent(undefined, 'md')
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, markdownEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching from & to a html editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = nativeComponent()
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, htmlEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should require alert switching from a html editor to custom editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = nativeComponent()
      const customEditor = nativeComponent(undefined, 'json')
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, customEditor)
      expect(requiresAlert).toBe(true)
    })

    it('should require alert switching from a custom editor to html editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = nativeComponent()
      const customEditor = nativeComponent(undefined, 'json')
      const requiresAlert = manager.doesEditorChangeRequireAlert(customEditor, htmlEditor)
      expect(requiresAlert).toBe(true)
    })

    it('should require alert switching from a custom editor to custom editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const customEditor = nativeComponent(undefined, 'json')
      const requiresAlert = manager.doesEditorChangeRequireAlert(customEditor, customEditor)
      expect(requiresAlert).toBe(true)
    })
  })
})
