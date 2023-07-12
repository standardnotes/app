import { ComponentFeatureDescription } from '@standardnotes/features'
import { Environment, Platform, UIFeature } from '@standardnotes/models'
import { DesktopManagerInterface } from '@standardnotes/services'

const DESKTOP_URL_PREFIX = 'sn://'
const LOCAL_HOST = 'localhost'
const CUSTOM_LOCAL_HOST = 'sn.local'
const ANDROID_LOCAL_HOST = '10.0.2.2'

export class GetFeatureUrlUseCase {
  constructor(
    private desktopManager: DesktopManagerInterface | undefined,
    private environment: Environment,
    private platform: Platform,
  ) {}

  execute(uiFeature: UIFeature<ComponentFeatureDescription>): string | undefined {
    if (this.desktopManager) {
      return this.urlForFeatureOnDesktop(uiFeature)
    }

    if (uiFeature.isFeatureDescription) {
      return this.urlForNativeComponent(uiFeature.asFeatureDescription)
    }

    if (uiFeature.asComponent.offlineOnly) {
      return undefined
    }

    const url = uiFeature.asComponent.hosted_url || uiFeature.asComponent.legacy_url
    if (!url) {
      return undefined
    }

    if (this.isMobile) {
      const localReplacement = this.platform === Platform.Ios ? LOCAL_HOST : ANDROID_LOCAL_HOST
      return url.replace(LOCAL_HOST, localReplacement).replace(CUSTOM_LOCAL_HOST, localReplacement)
    }

    return url
  }

  private urlForFeatureOnDesktop(uiFeature: UIFeature<ComponentFeatureDescription>): string | undefined {
    if (!this.desktopManager) {
      throw new Error('Desktop manager is not defined')
    }

    if (uiFeature.isFeatureDescription) {
      return `${this.desktopManager.getExtServerHost()}/components/${uiFeature.featureIdentifier}/${
        uiFeature.asFeatureDescription.index_path
      }`
    } else {
      if (uiFeature.asComponent.local_url) {
        return uiFeature.asComponent.local_url.replace(DESKTOP_URL_PREFIX, this.desktopManager.getExtServerHost() + '/')
      }

      return uiFeature.asComponent.hosted_url || uiFeature.asComponent.legacy_url
    }
  }

  private urlForNativeComponent(feature: ComponentFeatureDescription): string {
    if (this.isMobile) {
      const baseUrlRequiredForThemesInsideEditors = window.location.href.split('/index.html')[0]
      return `${baseUrlRequiredForThemesInsideEditors}/web-src/components/assets/${feature.identifier}/${feature.index_path}`
    } else {
      const baseUrlRequiredForThemesInsideEditors = window.location.origin
      return `${baseUrlRequiredForThemesInsideEditors}/components/assets/${feature.identifier}/${feature.index_path}`
    }
  }

  get isMobile(): boolean {
    return this.environment === Environment.Mobile
  }
}
