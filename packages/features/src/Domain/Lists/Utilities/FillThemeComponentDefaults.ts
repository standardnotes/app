import { ContentType } from '@standardnotes/common'
import { ThemeFeatureDescription } from '../../Feature/ThemeFeatureDescription'
import { ComponentArea } from '../../Component/ComponentArea'

type RequiredThemeFields = Pick<ThemeFeatureDescription, 'availableInRoles'>

export function FillThemeComponentDefaults(
  theme: Partial<ThemeFeatureDescription> & RequiredThemeFields,
): ThemeFeatureDescription {
  if (!theme.index_path) {
    theme.index_path = 'index.css'
  }

  theme.content_type = ContentType.Theme

  if (!theme.area) {
    theme.area = ComponentArea.Themes
  }

  return theme as ThemeFeatureDescription
}
