import { DisplayStringForContentType } from '@standardnotes/common'
import { ComponentAction, ComponentArea, ComponentPermission } from '@standardnotes/features'
import { ComponentInterface } from '@standardnotes/models'
import { uniqueArray } from '@standardnotes/utils'

export function permissionsStringForPermissions(
  permissions: ComponentPermission[],
  component: ComponentInterface,
): string {
  if (permissions.length === 0) {
    return '.'
  }

  let contentTypeStrings: string[] = []
  let contextAreaStrings: string[] = []

  permissions.forEach((permission) => {
    switch (permission.name) {
      case ComponentAction.StreamItems:
        if (!permission.content_types) {
          return
        }
        permission.content_types.forEach((contentType) => {
          const desc = DisplayStringForContentType(contentType)
          if (desc) {
            contentTypeStrings.push(`${desc}s`)
          } else {
            contentTypeStrings.push(`items of type ${contentType}`)
          }
        })
        break
      case ComponentAction.StreamContextItem:
        {
          const componentAreaMapping = {
            [ComponentArea.EditorStack]: 'working note',
            [ComponentArea.Editor]: 'working note',
            [ComponentArea.Themes]: 'Unknown',
          }
          contextAreaStrings.push(componentAreaMapping[component.area])
        }
        break
    }
  })

  contentTypeStrings = uniqueArray(contentTypeStrings)
  contextAreaStrings = uniqueArray(contextAreaStrings)

  if (contentTypeStrings.length === 0 && contextAreaStrings.length === 0) {
    return '.'
  }
  return contentTypeStrings.concat(contextAreaStrings).join(', ') + '.'
}
