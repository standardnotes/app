import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import MenuItem from '../Menu/MenuItem'
import { useApplication } from '../ApplicationProvider'
import { FileBackupRecord, FileItem } from '@standardnotes/snjs'
import { dateToStringStyle1 } from '@/Utils/DateUtils'
import { MenuItemIconSize } from '@/Constants/TailwindClassNames'
import MenuSection from '../Menu/MenuSection'

export const FileContextMenuBackupOption: FunctionComponent<{ file: FileItem }> = ({ file }) => {
  const application = useApplication()

  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)
  const [backupAbsolutePath, setBackupAbsolutePath] = useState<string | undefined>(undefined)

  useEffect(() => {
    void application.fileBackups?.getFileBackupInfo(file).then(setBackupInfo)
  }, [application, file])

  useEffect(() => {
    if (!backupInfo) {
      return
    }

    void application.fileBackups?.getFileBackupAbsolutePath(backupInfo).then(setBackupAbsolutePath)
  }, [backupInfo, application])

  const openFileBackup = useCallback(() => {
    if (backupInfo) {
      void application.fileBackups?.openFileBackup(backupInfo)
    }
  }, [backupInfo, application])

  const configureFileBackups = useCallback(() => {
    application.openPreferences('backups')
  }, [application])

  if (!application.fileBackups) {
    return null
  }

  return (
    <MenuSection>
      {backupInfo && (
        <MenuItem
          icon={'check-circle'}
          iconClassName={`text-success mt-1 ${MenuItemIconSize}`}
          className={'items-start'}
          onClick={openFileBackup}
        >
          <div className="ml-2">
            <div className="font-semibold text-success">Backed up on {dateToStringStyle1(backupInfo.backedUpOn)}</div>
            <div className="text-xs text-neutral">{backupAbsolutePath}</div>
          </div>
        </MenuItem>
      )}

      {!backupInfo && application.fileBackups && (
        <MenuItem
          icon={'safe-square'}
          className={'items-start'}
          iconClassName={`text-neutral mt-1 ${MenuItemIconSize}`}
          onClick={configureFileBackups}
        >
          <div className="ml-2">
            <div>Configure file backups</div>
            <div className="text-xs text-neutral">File not backed up locally</div>
          </div>
        </MenuItem>
      )}
    </MenuSection>
  )
}
