import { AppData, DefaultAppDomain } from '../Item/Types/DefaultAppDomain'
import { ContentReference } from '../Reference/ContentReference'
import { AppDataField } from '../Item/Types/AppDataField'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SpecializedContent {}

export interface ItemContent {
  references: ContentReference[]
  conflict_of?: string
  protected?: boolean
  trashed?: boolean
  pinned?: boolean
  archived?: boolean
  starred?: boolean
  locked?: boolean
  appData?: AppData
}

/**
 * Modifies the input object to fill in any missing required values from the
 * content body.
 */

export function FillItemContent<C extends ItemContent = ItemContent>(content: Partial<C>): C {
  if (!content.references) {
    content.references = []
  }

  if (!content.appData) {
    content.appData = {
      [DefaultAppDomain]: {},
    }
  }

  if (!content.appData[DefaultAppDomain]) {
    content.appData[DefaultAppDomain] = {}
  }

  if (!content.appData[DefaultAppDomain][AppDataField.UserModifiedDate]) {
    content.appData[DefaultAppDomain][AppDataField.UserModifiedDate] = new Date().toString()
  }

  return content as C
}

export function FillItemContentSpecialized<S extends SpecializedContent, C extends ItemContent = ItemContent>(
  content: S,
): C {
  return FillItemContent(content)
}
