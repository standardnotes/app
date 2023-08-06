import { UIFeature, ComponentInterface } from '@standardnotes/models'
import { ItemManagerInterface } from '@standardnotes/services'
import { NativeFeatureIdentifier, FindNativeTheme, ThemeFeatureDescription } from '@standardnotes/features'
import { Uuid } from '@standardnotes/domain-core'

export class ActiveThemeList {
  private list: (NativeFeatureIdentifier | Uuid)[] = []

  constructor(
    private items: ItemManagerInterface,
    initialList?: (NativeFeatureIdentifier | Uuid)[],
  ) {
    if (initialList) {
      this.list = initialList
    }
  }

  public getList(): (NativeFeatureIdentifier | Uuid)[] {
    return this.list.slice()
  }

  public isEmpty(): boolean {
    return this.list.length === 0
  }

  public clear(): void {
    this.list = []
  }

  public has(candidate: NativeFeatureIdentifier | Uuid): boolean {
    for (const entry of this.list) {
      if (entry.equals(candidate)) {
        return true
      }
    }

    return false
  }

  public add(candidate: NativeFeatureIdentifier | Uuid): void {
    if (!this.has(candidate)) {
      this.list.push(candidate)
    }
  }

  public remove(candidate: NativeFeatureIdentifier | Uuid): void {
    this.list = this.list.filter((entry) => {
      return !entry.equals(candidate)
    })
  }

  public asThemes(): UIFeature<ThemeFeatureDescription>[] {
    const results: UIFeature<ThemeFeatureDescription>[] = []

    for (const entry of this.list) {
      if (entry instanceof Uuid) {
        const theme = this.items.findItem<ComponentInterface>(entry.value)
        if (theme) {
          const uiFeature = new UIFeature<ThemeFeatureDescription>(theme)
          results.push(uiFeature)
        }
      } else {
        const theme = FindNativeTheme(entry.value)
        if (theme) {
          const uiFeature = new UIFeature<ThemeFeatureDescription>(theme)
          results.push(uiFeature)
        }
      }
    }

    return results
  }
}
