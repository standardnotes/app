import { PopoverFileItemActionType } from '@/Components/AttachedFilesPopover/PopoverFileItemAction'
import { PopoverTabs } from '@/Components/AttachedFilesPopover/PopoverTabs'
import { isHandlingBackupDrag, isHandlingFileDrag } from '@/Utils/DragTypeCheck'
import { StreamingFileReader } from '@standardnotes/filepicker'
import { action, makeObservable, observable } from 'mobx'
import { WebApplication } from '../Application'
import { AbstractState } from './AbstractState'
import { AppState } from './AppState'

export class FilesDragService extends AbstractState {
  dragCount = 0
  isDraggingFiles = false

  constructor(application: WebApplication, override appState: AppState, appObservers: (() => void)[]) {
    super(application, appState)

    makeObservable(this, {
      dragCount: observable,
      isDraggingFiles: observable,

      setDragCount: action,
      setIsDraggingFiles: action,
    })

    window.addEventListener('dragenter', this.handleDragIn)
    window.addEventListener('dragleave', this.handleDragOut)
    window.addEventListener('dragover', this.handleDrag)
    window.addEventListener('drop', this.handleDrop)

    appObservers.push(() => {
      window.removeEventListener('dragenter', this.handleDragIn)
      window.removeEventListener('dragleave', this.handleDragOut)
      window.removeEventListener('dragover', this.handleDrag)
      window.removeEventListener('drop', this.handleDrop)
    })
  }

  setDragCount = (dragCount: number) => {
    this.dragCount = dragCount
  }

  setIsDraggingFiles = (isDraggingFiles: boolean) => {
    this.isDraggingFiles = isDraggingFiles
  }

  handleDrag = (event: DragEvent) => {
    if (isHandlingFileDrag(event, this.application)) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  handleDragIn = (event: DragEvent) => {
    if (!isHandlingFileDrag(event, this.application)) {
      this.setIsDraggingFiles(false)
      return
    }

    event.preventDefault()
    event.stopPropagation()

    switch ((event.target as HTMLElement).id) {
      case PopoverTabs.AllFiles:
        this.appState.files.setCurrentTab(PopoverTabs.AllFiles)
        break
      case PopoverTabs.AttachedFiles:
        this.appState.files.setCurrentTab(PopoverTabs.AttachedFiles)
        break
    }

    this.setDragCount(this.dragCount + 1)

    if (event.dataTransfer?.items.length) {
      this.setIsDraggingFiles(true)
    }
  }

  handleDragOut = (event: DragEvent) => {
    if (!isHandlingFileDrag(event, this.application)) {
      this.setIsDraggingFiles(false)
      return
    }

    event.preventDefault()
    event.stopPropagation()

    this.setDragCount(this.dragCount - 1)

    if (this.dragCount > 0) {
      return
    }

    this.setIsDraggingFiles(false)
  }

  handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer?.items) {
      return
    }

    const items = Array.from(event.dataTransfer.items)

    if (!isHandlingFileDrag(event, this.application)) {
      this.setIsDraggingFiles(false)

      if (isHandlingBackupDrag(event, this.application)) {
        event.preventDefault()
        event.stopPropagation()
      }

      return
    }

    event.preventDefault()
    event.stopPropagation()

    this.setIsDraggingFiles(false)

    if (!this.appState.features.hasFiles) {
      void this.appState.features.showPremiumAlert('Files')
      return
    }

    items.forEach(async (item) => {
      const fileOrHandle = StreamingFileReader.available()
        ? ((await item.getAsFileSystemHandle()) as FileSystemFileHandle)
        : item.getAsFile()

      if (!fileOrHandle) {
        return
      }

      const uploadedFiles = await this.appState.files.uploadNewFile(fileOrHandle)

      if (!uploadedFiles) {
        return
      }

      if (this.appState.files.currentTab === PopoverTabs.AttachedFiles) {
        uploadedFiles.forEach((file) => {
          void this.appState.files.handleFileAction(
            {
              type: PopoverFileItemActionType.AttachFileToNote,
              payload: file,
            },
            this.appState.files.currentTab,
          )
        })
      }
    })

    event.dataTransfer.clearData()
    this.setDragCount(0)
  }
}
