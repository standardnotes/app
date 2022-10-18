import { WebApplication } from '@/Application/Application'
import { FeaturesController } from '@/Controllers/FeaturesController'
import { FilesController } from '@/Controllers/FilesController'
import { usePremiumModal } from '@/Hooks/usePremiumModal'
import { isHandlingFileDrag } from '@/Utils/DragTypeCheck'
import { StreamingFileReader } from '@standardnotes/filepicker'
import { useMemo, useState, createContext, ReactNode, useRef, useCallback, useEffect, useContext } from 'react'

type FileDnDContextData = {
  isDraggingFiles: boolean
}

export const FileDnDContext = createContext<FileDnDContextData | null>(null)

export const useFileDragNDrop = () => {
  const value = useContext(FileDnDContext)

  if (!value) {
    throw new Error('Current component must be a child of <FileDragNDropProvider />')
  }

  return value
}

type Props = {
  application: WebApplication
  featuresController: FeaturesController
  filesController: FilesController
  children: ReactNode
}

const FileDragNDropProvider = ({ application, children, featuresController, filesController }: Props) => {
  const premiumModal = usePremiumModal()
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)

  const dragCounter = useRef(0)

  const handleDrag = useCallback(
    (event: DragEvent) => {
      if (isHandlingFileDrag(event, application)) {
        event.preventDefault()
        event.stopPropagation()
      }
    },
    [application],
  )

  const handleDragIn = useCallback(
    (event: DragEvent) => {
      if (!isHandlingFileDrag(event, application)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      dragCounter.current = dragCounter.current + 1

      if (event.dataTransfer?.items.length) {
        setIsDraggingFiles(true)
      }
    },
    [application],
  )

  const handleDragOut = useCallback(
    (event: DragEvent) => {
      if (!isHandlingFileDrag(event, application)) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      dragCounter.current = dragCounter.current - 1

      if (dragCounter.current > 0) {
        return
      }

      setIsDraggingFiles(false)
    },
    [application],
  )

  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!isHandlingFileDrag(event, application)) {
        setIsDraggingFiles(false)
        return
      }

      event.preventDefault()
      event.stopPropagation()

      setIsDraggingFiles(false)

      if (!featuresController.hasFiles) {
        premiumModal.activate('Files')
        return
      }

      if (event.dataTransfer?.items.length) {
        Array.from(event.dataTransfer.items).forEach(async (item) => {
          const fileOrHandle = StreamingFileReader.available()
            ? ((await item.getAsFileSystemHandle()) as FileSystemFileHandle)
            : item.getAsFile()

          if (!fileOrHandle) {
            return
          }

          const uploadedFiles = await filesController.uploadNewFile(fileOrHandle)

          if (!uploadedFiles) {
            return
          }
        })

        event.dataTransfer.clearData()
        dragCounter.current = 0
      }
    },
    [application, featuresController.hasFiles, filesController, premiumModal],
  )

  useEffect(() => {
    window.addEventListener('dragenter', handleDragIn)
    window.addEventListener('dragleave', handleDragOut)
    window.addEventListener('dragover', handleDrag)
    window.addEventListener('drop', handleDrop)

    return () => {
      window.removeEventListener('dragenter', handleDragIn)
      window.removeEventListener('dragleave', handleDragOut)
      window.removeEventListener('dragover', handleDrag)
      window.removeEventListener('drop', handleDrop)
    }
  }, [handleDragIn, handleDrop, handleDrag, handleDragOut])

  const contextValue = useMemo(() => {
    return {
      isDraggingFiles,
    }
  }, [isDraggingFiles])

  return <FileDnDContext.Provider value={contextValue}>{children}</FileDnDContext.Provider>
}

export default FileDragNDropProvider
