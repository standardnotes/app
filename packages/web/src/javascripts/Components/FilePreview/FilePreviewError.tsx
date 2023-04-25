import { FilesController } from '@/Controllers/FilesController'
import { NoPreviewIllustration } from '@standardnotes/icons'
import { FileItem } from '@standardnotes/snjs'
import { FileItemActionType } from '../AttachedFilesPopover/PopoverFileItemAction'
import Button from '../Button/Button'

type Props = {
  file: FileItem
  filesController: FilesController
  isFilePreviewable: boolean
  tryAgainCallback: () => void
}

const FilePreviewError = ({ file, filesController, isFilePreviewable, tryAgainCallback }: Props) => {
  return (
    <div className="flex flex-grow flex-col items-center justify-center">
      <NoPreviewIllustration className="mb-4 h-30 w-30" />
      <div className="mb-2 text-base font-bold">This file can't be previewed.</div>
      {isFilePreviewable ? (
        <>
          <div className="mb-4 max-w-[35ch] text-center text-sm text-passive-0">
            There was an error loading the file. Try again, or download the file and open it using another application.
          </div>
          <div className="flex items-center">
            <Button
              primary
              className="mr-3"
              onClick={() => {
                tryAgainCallback()
              }}
            >
              Try again
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
              Download
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="mb-4 max-w-[35ch] text-center text-sm text-passive-0">
            To view this file, download it and open it using another application.
          </div>
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
            Download
          </Button>
        </>
      )}
    </div>
  )
}

export default FilePreviewError
