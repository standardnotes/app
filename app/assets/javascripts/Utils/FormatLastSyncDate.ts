import { dateToLocalizedString } from '@standardnotes/snjs/'

export const formatLastSyncDate = (lastUpdatedDate: Date) => {
  return dateToLocalizedString(lastUpdatedDate)
}
