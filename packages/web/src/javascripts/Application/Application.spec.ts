/**
 * @jest-environment jsdom
 */

import {
  Environment,
  FeatureIdentifier,
  namespacedKey,
  Platform,
  RawStorageKey,
  SNComponent,
  SNComponentManager,
  SNLog,
  SNTag,
} from '@standardnotes/snjs'
import { WebApplication } from '@/Application/Application'
import { WebOrDesktopDevice } from './Device/WebOrDesktopDevice'

describe('web application', () => {
  let application: WebApplication
  let componentManager: SNComponentManager

  // eslint-disable-next-line no-console
  SNLog.onLog = console.log
  SNLog.onError = console.error

  beforeEach(() => {
    const identifier = '123'

    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addListener: jest.fn() })

    const device = {
      environment: Environment.Desktop,
      appVersion: '1.2.3',
      setApplication: jest.fn(),
      openDatabase: jest.fn().mockReturnValue(Promise.resolve()),
      getRawStorageValue: jest.fn().mockImplementation((key) => {
        if (key === namespacedKey(identifier, RawStorageKey.SnjsVersion)) {
          return '10.0.0'
        }
        return undefined
      }),
      setRawStorageValue: jest.fn(),
    } as unknown as jest.Mocked<WebOrDesktopDevice>

    application = new WebApplication(device, Platform.MacWeb, identifier, 'https://sync', 'https://socket')

    componentManager = {} as jest.Mocked<SNComponentManager>
    componentManager.legacyGetDefaultEditor = jest.fn()
    Object.defineProperty(application, 'componentManager', { value: componentManager })

    application.prepareForLaunch({ receiveChallenge: jest.fn() })
  })

  describe('geDefaultEditorIdentifier', () => {
    it('should return plain editor if no default tag editor or component editor', () => {
      const editorIdentifier = application.geDefaultEditorIdentifier()

      expect(editorIdentifier).toEqual(FeatureIdentifier.PlainEditor)
    })

    it('should return pref key based value if available', () => {
      application.getPreference = jest.fn().mockReturnValue(FeatureIdentifier.SuperEditor)

      const editorIdentifier = application.geDefaultEditorIdentifier()

      expect(editorIdentifier).toEqual(FeatureIdentifier.SuperEditor)
    })

    it('should return default tag identifier if tag supplied', () => {
      const tag = {
        preferences: {
          editorIdentifier: FeatureIdentifier.SuperEditor,
        },
      } as jest.Mocked<SNTag>

      const editorIdentifier = application.geDefaultEditorIdentifier(tag)

      expect(editorIdentifier).toEqual(FeatureIdentifier.SuperEditor)
    })

    it('should return legacy editor identifier', () => {
      const editor = {
        legacyIsDefaultEditor: jest.fn().mockReturnValue(true),
        identifier: FeatureIdentifier.MarkdownProEditor,
      } as unknown as jest.Mocked<SNComponent>

      componentManager.legacyGetDefaultEditor = jest.fn().mockReturnValue(editor)

      const editorIdentifier = application.geDefaultEditorIdentifier()

      expect(editorIdentifier).toEqual(FeatureIdentifier.MarkdownProEditor)
    })
  })
})
