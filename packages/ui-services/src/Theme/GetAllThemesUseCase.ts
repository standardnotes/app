import { FindNativeTheme, GetNativeThemes, ThemeFeatureDescription } from '@standardnotes/features'
import { UIFeature, ThemeInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'

export class GetAllThemesUseCase {
  constructor(private readonly items: ItemManagerInterface) {}

  execute(options: { excludeLayerable: boolean }): {
    thirdParty: UIFeature<ThemeFeatureDescription>[]
    native: UIFeature<ThemeFeatureDescription>[]
  } {
    const nativeThemes = GetNativeThemes().filter((feature) => (options.excludeLayerable ? !feature.layerable : true))

    const allThirdPartyThemes = this.items
      .getDisplayableComponents()
      .filter(
        (component) => component.isTheme() && FindNativeTheme(component.identifier) === undefined,
      ) as ThemeInterface[]

    const filteredThirdPartyThemes = allThirdPartyThemes.filter((theme) => {
      return options.excludeLayerable ? !theme.layerable : true
    })

    return {
      thirdParty: filteredThirdPartyThemes.map((theme) => new UIFeature<ThemeFeatureDescription>(theme)),
      native: nativeThemes.map((theme) => new UIFeature(theme)),
    }
  }
}
