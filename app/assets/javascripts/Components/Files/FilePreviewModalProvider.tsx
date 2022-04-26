import { WebApplication } from '@/UIModels/Application'
import { SNFile } from '@standardnotes/snjs'
import { createContext, FunctionComponent } from 'preact'
import { useContext, useState } from 'preact/hooks'
import { FilePreviewModal } from './FilePreviewModal'

type FilePreviewActivateFunction = (file: SNFile, attachedFiles: SNFile[]) => void

type FilePreviewModalContextData = {
  activate: FilePreviewActivateFunction
  setCurrentFile: (file: SNFile) => void
}

const FilePreviewModalContext = createContext<FilePreviewModalContextData | null>(null)

export const useFilePreviewModal = (): FilePreviewModalContextData => {
  const value = useContext(FilePreviewModalContext)

  if (!value) {
    throw new Error('FilePreviewModalProvider not found.')
  }

  return value
}

export const FilePreviewModalProvider: FunctionComponent<{
  application: WebApplication
}> = ({ application, children }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState<SNFile>()
  const [attachedFiles, setAttachedFiles] = useState<SNFile[]>([])

  const activate: FilePreviewActivateFunction = (file, attachedFiles) => {
    setCurrentFile(file)
    setAttachedFiles(attachedFiles)
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
  }

  return (
    <>
      <FilePreviewModalContext.Provider value={{ activate, setCurrentFile }}>
        {isOpen && currentFile && (
          <FilePreviewModal
            application={application}
            attachedFiles={attachedFiles}
            file={currentFile}
            onDismiss={close}
          />
        )}
        {children}
      </FilePreviewModalContext.Provider>
    </>
  )
}
