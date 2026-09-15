import { Alert } from 'react-native'
import { c } from 'ttag'

export const showLoadFailForItemIds = (failedItemIds: string[]) => {
  const items = failedItemIds.join('\n')
  const text = c('B8.MobileDesktopShared.Mobile.Database.Info')
    .t`The following items could not be loaded. This may happen if you are in low-memory conditions, or if the note is very large in size. We recommend breaking up large notes into smaller chunks using the desktop or web app.\n\nItems:\n${items}`

  Alert.alert(c('B8.MobileDesktopShared.Mobile.Database.Title').t`Unable to load item(s)`, text)
}
