import { ContentType } from '@standardnotes/domain-core'
import { FindNativeFeature, GetFeatures, ThirdPartyFeatureDescription } from '@standardnotes/features'
import {
  ComponentContent,
  ComponentContentSpecialized,
  ComponentInterface,
  FillItemContentSpecialized,
} from '@standardnotes/models'
import {
  AlertService,
  API_MESSAGE_FAILED_DOWNLOADING_EXTENSION,
  LegacyApiServiceInterface,
  ItemManagerInterface,
} from '@standardnotes/services'
import { isString } from '@standardnotes/utils'

export class DownloadRemoteThirdPartyFeatureUseCase {
  constructor(private api: LegacyApiServiceInterface, private items: ItemManagerInterface, private alerts: AlertService) {}

  async execute(url: string): Promise<ComponentInterface | undefined> {
    const response = await this.api.downloadFeatureUrl(url)
    if (response.data?.error) {
      await this.alerts.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return undefined
    }

    let rawFeature = response.data as ThirdPartyFeatureDescription

    if (isString(rawFeature)) {
      try {
        rawFeature = JSON.parse(rawFeature)
        // eslint-disable-next-line no-empty
      } catch (error) {}
    }

    if (!rawFeature.content_type) {
      return
    }

    const isValidContentType = [
      ContentType.TYPES.Component,
      ContentType.TYPES.Theme,
      ContentType.TYPES.ActionsExtension,
      ContentType.TYPES.ExtensionRepo,
    ].includes(rawFeature.content_type)

    if (!isValidContentType) {
      return
    }

    const nativeFeature = FindNativeFeature(rawFeature.identifier)
    if (nativeFeature) {
      await this.alerts.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
      return
    }

    if (rawFeature.url) {
      for (const nativeFeature of GetFeatures()) {
        if (rawFeature.url.includes(nativeFeature.identifier)) {
          await this.alerts.alert(API_MESSAGE_FAILED_DOWNLOADING_EXTENSION)
          return
        }
      }
    }

    const content = FillItemContentSpecialized<ComponentContentSpecialized, ComponentContent>({
      area: rawFeature.area,
      name: rawFeature.name ?? '',
      package_info: rawFeature,
      valid_until: new Date(rawFeature.expires_at || 0),
      hosted_url: rawFeature.url,
    })

    const component = this.items.createTemplateItem<ComponentContent, ComponentInterface>(
      rawFeature.content_type,
      content,
    )

    return component
  }
}
