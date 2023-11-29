import { ContentType } from '@standardnotes/domain-core'
import {
  NativeFeatureIdentifier,
  FindNativeFeature,
  IframeComponentFeatureDescription,
  UIFeatureDescriptionTypes,
} from '@standardnotes/features'
import {
  ComponentContent,
  ComponentInterface,
  ComponentPackageInfo,
  DecryptedPayload,
  Environment,
  PayloadTimestampDefaults,
  Platform,
  ComponentItem,
  UIFeature,
} from '@standardnotes/models'
import { DesktopManagerInterface } from '@standardnotes/services'
import { GetFeatureUrl } from './GetFeatureUrl'

const desktopExtHost = 'http://localhost:123'

const nativeFeatureAsUIFeature = <F extends UIFeatureDescriptionTypes>(identifier: string) => {
  return new UIFeature(FindNativeFeature<F>(identifier)!)
}

const thirdPartyFeature = () => {
  const component = new ComponentItem(
    new DecryptedPayload({
      uuid: '789',
      content_type: ContentType.TYPES.Component,
      ...PayloadTimestampDefaults(),
      content: {
        local_url: 'sn://Extensions/non-native-identifier/dist/index.html',
        hosted_url: 'https://example.com/component',
        package_info: {
          identifier: 'non-native-identifier',
          expires_at: new Date().getTime(),
          availableInRoles: [],
        } as unknown as jest.Mocked<ComponentPackageInfo>,
      } as unknown as jest.Mocked<ComponentContent>,
    }),
  )

  return new UIFeature<IframeComponentFeatureDescription>(component)
}

describe('GetFeatureUrl', () => {
  let usecase: GetFeatureUrl

  beforeEach(() => {
    global.window = {
      location: {
        origin: 'http://localhost',
      },
    } as Window & typeof globalThis
  })

  describe('desktop', () => {
    let desktopManager: jest.Mocked<DesktopManagerInterface | undefined>

    beforeEach(() => {
      desktopManager = {
        syncComponentsInstallation() {},
        registerUpdateObserver(_callback: (component: ComponentInterface) => void) {
          return () => {}
        },
        getExtServerHost() {
          return desktopExtHost
        },
      } as unknown as jest.Mocked<DesktopManagerInterface | undefined>

      usecase = new GetFeatureUrl(desktopManager, Environment.Desktop, Platform.MacDesktop)
    })

    it('returns native path for native component', () => {
      const feature = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(
        NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor,
      )!
      const url = usecase.execute(feature)
      expect(url).toEqual(
        `${desktopExtHost}/components/${feature.featureIdentifier}/${feature.asFeatureDescription.index_path}`,
      )
    })

    it('returns native path for deprecated native component', () => {
      const feature = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(
        NativeFeatureIdentifier.TYPES.DeprecatedBoldEditor,
      )!
      const url = usecase.execute(feature)
      expect(url).toEqual(
        `${desktopExtHost}/components/${feature?.featureIdentifier}/${feature.asFeatureDescription.index_path}`,
      )
    })

    it('returns nonnative path for third party component', () => {
      const feature = thirdPartyFeature()
      const url = usecase.execute(feature)
      expect(url).toEqual(`${desktopExtHost}/Extensions/${feature.featureIdentifier}/dist/index.html`)
    })

    it('returns hosted url for third party component with no local_url', () => {
      const component = new ComponentItem({
        uuid: '789',
        content_type: ContentType.TYPES.Component,
        content: {
          hosted_url: 'https://example.com/component',
          package_info: {
            identifier: 'non-native-identifier',
            valid_until: new Date(),
          },
        },
      } as never)
      const feature = new UIFeature<IframeComponentFeatureDescription>(component)
      const url = usecase.execute(feature)
      expect(url).toEqual('https://example.com/component')
    })
  })

  describe('web', () => {
    beforeEach(() => {
      usecase = new GetFeatureUrl(undefined, Environment.Web, Platform.MacWeb)
    })

    it('returns native path for native feature', () => {
      const feature = nativeFeatureAsUIFeature<IframeComponentFeatureDescription>(
        NativeFeatureIdentifier.TYPES.DeprecatedMarkdownProEditor,
      )
      const url = usecase.execute(feature)
      expect(url).toEqual(
        `http://localhost/components/assets/${feature.featureIdentifier}/${feature.asFeatureDescription.index_path}`,
      )
    })

    it('returns hosted path for third party component', () => {
      const feature = thirdPartyFeature()
      const url = usecase.execute(feature)
      expect(url).toEqual(feature.asComponent.hosted_url)
    })
  })
})
