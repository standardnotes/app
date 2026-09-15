import { c } from 'ttag'

export const Strings = {
  get UnsupportedBackupFileVersion() {
    return c('B1.Account.ImportExport.Error')
      .t`This backup file was created using a newer version of the application and cannot be imported here. Please update your application and try again.`
  },
  get BackupFileMoreRecentThanAccount() {
    return c('B1.Account.ImportExport.Error')
      .t`This backup file was created using a newer encryption version than your account's. Please run the available encryption upgrade and try again.`
  },
  get FileAccountPassword() {
    return c('B1.Account.ImportExport.Label').t`File account password`
  },
}
