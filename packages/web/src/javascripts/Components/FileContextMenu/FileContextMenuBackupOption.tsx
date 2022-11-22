import { FunctionComponent, useCallback, useEffect, useState } from 'react'
import MenuItem from '../Menu/MenuItem'
import { useApplication } from '../ApplicationView/ApplicationProvider'
import { FileBackupRecord, FileItem } from '@standardnotes/snjs'
import { dateToStringStyle1 } from '@/Utils/DateUtils'

export const FileContextMenuBackupOption: FunctionComponent<{ file: FileItem }> = ({ file }) => {
  const application = useApplication()

  const [backupInfo, setBackupInfo] = useState<FileBackupRecord | undefined>(undefined)

  useEffect(() => {
    void application.fileBackups?.getFileBackupInfo(file).then(setBackupInfo)
  }, [application, file])

  const openFileBackup = useCallback(() => {
    if (backupInfo) {
      void application.fileBackups?.openFileBackup(backupInfo)
    }
  }, [backupInfo, application])

  const configureFileBackups = useCallback(() => {
    application.openPreferences('backups')
  }, [application])

  return (
    <>
      {backupInfo && (
        <MenuItem
          icon={'check-circle'}
          iconClassName={'text-success mt-1'}
          className={'items-start'}
          onClick={openFileBackup}
        >
          <div className="ml-2">
            <div className="font-semibold text-success">Backed up on {dateToStringStyle1(backupInfo.backedUpOn)}</div>
            <div className="text-xs text-neutral">{backupInfo.absolutePath}</div>
          </div>
        </MenuItem>
      )}

      {!backupInfo && application.fileBackups && (
        <MenuItem
          icon={'safe-square'}
          className={'items-start'}
          iconClassName={'text-neutral mt-1'}
          onClick={configureFileBackups}
        >
          <div className="ml-2">
            <div>Configure file backups</div>
            <div className="text-xs text-neutral">File not backed up locally</div>
          </div>
        </MenuItem>
      )}
    </>
  )
}
