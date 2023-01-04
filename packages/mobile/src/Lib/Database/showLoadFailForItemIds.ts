import { Alert } from 'react-native'

export const showLoadFailForItemIds = (failedItemIds: string[]) => {
  let text =
    'The following items could not be loaded. This may happen if you are in low-memory conditions, or if the note is very large in size. We recommend breaking up large notes into smaller chunks using the desktop or web app.\n\nItems:\n'
  let index = 0
  text += failedItemIds.map((id) => {
    let result = id
    if (index !== failedItemIds.length - 1) {
      result += '\n'
    }
    index++
    return result
  })
  Alert.alert('Unable to load item(s)', text)
}
