import {
  ContentType,
  GetFeatures,
  ItemManagerInterface,
  ThemeFeatureDescription,
  ThemeInterface,
} from '@standardnotes/snjs'
import { ThemeItem } from './ThemeItem'

export class GetAllThemesUseCase {
  constructor(private readonly items: ItemManagerInterface) {}

  execute(): { thirdParty: ThemeItem[]; native: ThemeItem[] } {
    const thirdPartyThemes = this.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme())
      .map((item) => {
        return {
          name: item.displayName,
          identifier: item.identifier,
          componentOrNativeTheme: item as ThemeInterface,
        }
      })

    const nativeThemes = GetFeatures()
      .filter((feature) => feature.content_type === ContentType.Theme && !feature.layerable)
      .filter((theme) => thirdPartyThemes.find((item) => item.identifier === theme.identifier) === undefined)
      .map((theme) => {
        return {
          name: theme.name as string,
          identifier: theme.identifier,
          componentOrNativeTheme: theme as ThemeFeatureDescription,
        }
      })

    return {
      thirdParty: thirdPartyThemes,
      native: nativeThemes,
    }
  }
}
