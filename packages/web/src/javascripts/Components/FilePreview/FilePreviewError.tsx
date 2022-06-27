import { FilesController } from '@/Controllers/FilesController'
import { NoPreviewIllustration } from '@standardnotes/icons'
import { FileItem } from '@standardnotes/snjs'
import Button from '../Button/Button'

type Props = {
  file: FileItem
  filesController: FilesController
  isFilePreviewable: boolean
  tryAgainCallback: () => void
}

const FilePreviewError = ({ file, filesController, isFilePreviewable, tryAgainCallback }: Props) => {
  return (
    <div className="flex flex-col justify-center items-center flex-grow">
      <NoPreviewIllustration className="w-30 h-30 mb-4" />
      <div className="font-bold text-base mb-2">This file can't be previewed.</div>
      {isFilePreviewable ? (
        <>
          <div className="text-sm text-center text-passive-0 mb-4 max-w-35ch">
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
                filesController.downloadFile(file).catch(console.error)
              }}
            >
              Download
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="text-sm text-center text-passive-0 mb-4 max-w-35ch">
            To view this file, download it and open it using another application.
          </div>
          <Button
            primary
            onClick={() => {
              filesController.downloadFile(file).catch(console.error)
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
