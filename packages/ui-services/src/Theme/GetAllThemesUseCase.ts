import { GetNativeThemes, ThemeFeatureDescription } from '@standardnotes/features'
import { ThemeInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'

export class GetAllThemesUseCase {
  constructor(private readonly items: ItemManagerInterface) {}

  execute(options: { excludeLayerable: boolean }): { thirdParty: ThemeInterface[]; native: ThemeFeatureDescription[] } {
    const allThirdPartyThemes = this.items
      .getDisplayableComponents()
      .filter((component) => component.isTheme()) as ThemeInterface[]

    const filteredThirdPartyThemes = allThirdPartyThemes.filter((theme) => {
      return options.excludeLayerable ? !theme.layerable : true
    })

    const nativeThemes = GetNativeThemes()
      .filter((feature) => (options.excludeLayerable ? !feature.layerable : true))
      .filter((theme) => allThirdPartyThemes.find((item) => item.identifier === theme.identifier) === undefined)

    return {
      thirdParty: filteredThirdPartyThemes,
      native: nativeThemes,
    }
  }
}
