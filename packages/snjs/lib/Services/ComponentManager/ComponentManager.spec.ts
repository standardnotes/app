/**
 * @jest-environment jsdom
 */

import { SNPreferencesService } from '../Preferences/PreferencesService'
import { createNote } from './../../Spec/SpecUtils'
import {
  ComponentAction,
  ComponentPermission,
  FindNativeFeature,
  FeatureIdentifier,
  NoteType,
} from '@standardnotes/features'
import { ContentType } from '@standardnotes/common'
import { GenericItem, SNComponent, Environment, Platform, ComponentInterface } from '@standardnotes/models'
import {
  DesktopManagerInterface,
  InternalEventBusInterface,
  AlertService,
  DeviceInterface,
  MutatorClientInterface,
  ItemManagerInterface,
  SyncServiceInterface,
  PreferenceServiceInterface,
} from '@standardnotes/services'
import { ItemManager } from '@Lib/Services/Items/ItemManager'
import { SNFeaturesService } from '@Lib/Services/Features/FeaturesService'
import { SNComponentManager } from './ComponentManager'
import { SNSyncService } from '../Sync/SyncService'

describe('featuresService', () => {
  let items: ItemManagerInterface
  let mutator: MutatorClientInterface
  let features: SNFeaturesService
  let alerts: AlertService
  let sync: SyncServiceInterface
  let prefs: PreferenceServiceInterface
  let eventBus: InternalEventBusInterface
  let device: DeviceInterface

  const desktopExtHost = 'http://localhost:123'

  const createManager = (environment: Environment, platform: Platform) => {
    const manager = new SNComponentManager(
      items,
      mutator,
      sync,
      features,
      prefs,
      alerts,
      environment,
      platform,
      device,
      eventBus,
    )

    if (environment === Environment.Desktop) {
      const desktopManager: DesktopManagerInterface = {
        syncComponentsInstallation() {},
        registerUpdateObserver(_callback: (component: ComponentInterface) => void) {
          return () => {}
        },
        getExtServerHost() {
          return desktopExtHost
        },
      }
      manager.setDesktopManager(desktopManager)
    }

    return manager
  }

  beforeEach(() => {
    sync = {} as jest.Mocked<SNSyncService>
    sync.sync = jest.fn()

    items = {} as jest.Mocked<ItemManager>
    items.getItems = jest.fn().mockReturnValue([])
    items.addObserver = jest.fn()

    mutator = {} as jest.Mocked<MutatorClientInterface>
    mutator.createItem = jest.fn()
    mutator.changeComponent = jest.fn().mockReturnValue({} as jest.Mocked<GenericItem>)
    mutator.setItemsToBeDeleted = jest.fn()
    mutator.changeItem = jest.fn()
    mutator.changeFeatureRepo = jest.fn()

    features = {} as jest.Mocked<SNFeaturesService>

    prefs = {} as jest.Mocked<SNPreferencesService>
    prefs.addEventObserver = jest.fn()

    alerts = {} as jest.Mocked<AlertService>
    alerts.confirm = jest.fn()
    alerts.alert = jest.fn()

    eventBus = {} as jest.Mocked<InternalEventBusInterface>
    eventBus.publish = jest.fn()

    device = {} as jest.Mocked<DeviceInterface>
  })

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
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!, permissions),
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
      expect(
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!, permissions),
      ).toEqual(false)
    })

    it('no extension should be able to stream multiple tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Tag],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!, permissions),
      ).toEqual(false)
    })

    it('no extension should be able to stream multiple notes or tags', () => {
      const permissions: ComponentPermission[] = [
        {
          name: ComponentAction.StreamItems,
          content_types: [ContentType.Tag, ContentType.Note],
        },
      ]

      const manager = createManager(Environment.Desktop, Platform.MacDesktop)
      expect(
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!, permissions),
      ).toEqual(false)
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
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.DeprecatedFileSafe)!, permissions),
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
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.DeprecatedFileSafe)!, permissions),
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
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.DeprecatedBoldEditor)!, permissions),
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
      expect(
        manager.areRequestedPermissionsValid(FindNativeFeature(FeatureIdentifier.PlusEditor)!, permissions),
      ).toEqual(false)
    })
  })

  describe('urlForComponent', () => {
    describe('desktop', () => {
      it('returns native path for native component', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
        const url = manager.urlForComponent(component)
        const feature = FindNativeFeature(component.identifier)
        expect(url).toEqual(`${desktopExtHost}/components/${feature?.identifier}/${feature?.index_path}`)
      })

      it('returns native path for deprecated native component', () => {
        const manager = createManager(Environment.Desktop, Platform.MacDesktop)
        const component = FindNativeFeature(FeatureIdentifier.DeprecatedBoldEditor)!
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
        const feature = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
        const url = manager.urlForComponent(feature)
        expect(url).toEqual(`http://localhost/components/assets/${feature.identifier}/${feature.index_path}`)
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
      const component = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
      const requiresAlert = manager.doesEditorChangeRequireAlert(undefined, component)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching to plain editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const component = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
      const requiresAlert = manager.doesEditorChangeRequireAlert(component, undefined)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching from a markdown editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
      const markdownEditor = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)
      const requiresAlert = manager.doesEditorChangeRequireAlert(markdownEditor, htmlEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching to a markdown editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
      const markdownEditor = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, markdownEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should not require alert switching from & to a html editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = FindNativeFeature(FeatureIdentifier.MarkdownProEditor)!
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, htmlEditor)
      expect(requiresAlert).toBe(false)
    })

    it('should require alert switching from a html editor to custom editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = FindNativeFeature(FeatureIdentifier.PlusEditor)!
      const customEditor = FindNativeFeature(FeatureIdentifier.TokenVaultEditor)
      const requiresAlert = manager.doesEditorChangeRequireAlert(htmlEditor, customEditor)
      expect(requiresAlert).toBe(true)
    })

    it('should require alert switching from a custom editor to html editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const htmlEditor = FindNativeFeature(FeatureIdentifier.PlusEditor)!
      const customEditor = FindNativeFeature(FeatureIdentifier.TokenVaultEditor)
      const requiresAlert = manager.doesEditorChangeRequireAlert(customEditor, htmlEditor)
      expect(requiresAlert).toBe(true)
    })

    it('should require alert switching from a custom editor to custom editor', () => {
      const manager = createManager(Environment.Web, Platform.MacWeb)
      const customEditor = FindNativeFeature(FeatureIdentifier.TokenVaultEditor)
      const requiresAlert = manager.doesEditorChangeRequireAlert(customEditor, customEditor)
      expect(requiresAlert).toBe(true)
    })
  })
})
