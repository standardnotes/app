import { ContentType } from '@standardnotes/common'
import { ThemeFeatureDescription } from '../../Feature/FeatureDescription'
import { ComponentArea } from '../../Component/ComponentArea'

type RequiredThemeFields = Pick<ThemeFeatureDescription, 'availableInSubscriptions'>

export function FillThemeComponentDefaults(
  theme: Partial<ThemeFeatureDescription> & RequiredThemeFields,
): ThemeFeatureDescription {
  if (!theme.index_path) {
    theme.index_path = 'dist/dist.css'
  }

  theme.content_type = ContentType.Theme

  if (!theme.area) {
    theme.area = ComponentArea.Themes
  }

  return theme as ThemeFeatureDescription
}
