import { formatSizeToReadableString } from '@standardnotes/filepicker'
import { FileItem } from '@standardnotes/snjs'
import { FunctionComponent } from 'react'
import { c } from 'ttag'
import Icon from '@/Components/Icon/Icon'

type Props = {
  file: FileItem
}

const FilePreviewInfoPanel: FunctionComponent<Props> = ({ file }) => {
  return (
    <div className="flex min-w-70 flex-col p-4">
      <div className="mb-4 flex items-center">
        <Icon type="info" className="mr-2" />
        <div className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`File information`}</div>
      </div>
      <div className="mb-3">
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`Type:`}</span> {file.mimeType}
      </div>
      <div className="mb-3">
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`Decrypted Size:`}</span>{' '}
        {formatSizeToReadableString(file.decryptedSize)}
      </div>
      <div className="mb-3">
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`Encrypted Size:`}</span>{' '}
        {formatSizeToReadableString(file.encryptedSize)}
      </div>
      <div className="mb-3">
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`Created:`}</span>{' '}
        {file.created_at.toLocaleString()}
      </div>
      <div className="mb-3">
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`Last Modified:`}</span>{' '}
        {file.userModifiedDate.toLocaleString()}
      </div>
      <div>
        <span className="font-semibold">{c('B7.FilesSubscriptionHelp.Files.Info').t`File ID:`}</span> {file.uuid}
      </div>
    </div>
  )
}

export default FilePreviewInfoPanel
