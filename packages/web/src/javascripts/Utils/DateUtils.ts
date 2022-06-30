import { dateToLocalizedString } from '@standardnotes/snjs/'

export const formatLastSyncDate = (lastUpdatedDate: Date) => {
  return dateToLocalizedString(lastUpdatedDate)
}

export const formatDateForContextMenu = (date: Date | undefined) => {
  if (!date) {
    return
  }

  return `${date.toDateString()} ${date.toLocaleTimeString()}`
}
