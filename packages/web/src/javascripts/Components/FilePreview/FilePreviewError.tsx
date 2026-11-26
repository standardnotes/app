import { FilesController } from '@/Controllers/FilesController'
import { FileItem } from '@standardnotes/snjs'
import { c } from 'ttag'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Button from '../Button/Button'
import FilePreviewUnavailable from './FilePreviewUnavailable'

type Props = {
  file: FileItem
  filesController: FilesController
  isFilePreviewable: boolean
  tryAgainCallback: () => void
  errorDetail?: string
}

const FilePreviewError = ({ file, filesController, isFilePreviewable, tryAgainCallback, errorDetail }: Props) => {
  const description = isFilePreviewable
    ? errorDetail ??
      c('B7.FilesSubscriptionHelp.Files.Error')
        .t`There was an error loading the file. Try again, or download the file and open it using another application.`
    : c('B7.FilesSubscriptionHelp.Files.Info').t`To view this file, download it and open it using another application.`

  return (
    <FilePreviewUnavailable description={description}>
      {isFilePreviewable ? (
        <div className="flex items-center">
          <Button
            primary
            className="mr-3"
            onClick={() => {
              tryAgainCallback()
            }}
          >
            {c('B7.FilesSubscriptionHelp.Files.Info').t`Try again`}
          </Button>
          <Button
            onClick={() => {
              filesController
                .handleFileAction({
                  type: FileItemActionType.DownloadFile,
                  payload: {
                    file,
                  },
                })
                .catch(console.error)
            }}
          >
            {c('B7.FilesSubscriptionHelp.Files.Action').t`Download`}
          </Button>
        </div>
      ) : (
        <Button
          primary
          onClick={() => {
            filesController
              .handleFileAction({
                type: FileItemActionType.DownloadFile,
                payload: { file },
              })
              .catch(console.error)
          }}
        >
          {c('B7.FilesSubscriptionHelp.Files.Action').t`Download`}
        </Button>
      )}
    </FilePreviewUnavailable>
  )
}

export default FilePreviewError
