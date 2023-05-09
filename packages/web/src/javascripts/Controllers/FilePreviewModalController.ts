import { WebApplication } from '@/Application/WebApplication'
import { ContentType, FileItem } from '@standardnotes/snjs'
import { action, makeObservable, observable } from 'mobx'

export class FilePreviewModalController {
  isOpen = false
  currentFile: FileItem | undefined = undefined
  otherFiles: FileItem[] = []

  eventObservers: (() => void)[] = []

  constructor(application: WebApplication) {
    makeObservable(this, {
      isOpen: observable,
      currentFile: observable,
      otherFiles: observable,

      activate: action,
      dismiss: action,
      setCurrentFile: action,
    })

    this.eventObservers.push(
      application.streamItems(ContentType.File, ({ changed, removed }) => {
        if (!this.currentFile) {
          return
        }
        if (changed.includes(this.currentFile)) {
          this.setCurrentFile(this.currentFile)
        }
        if (removed.find((f) => f.uuid === this.currentFile?.uuid)) {
          if (!this.otherFiles.length) {
            this.dismiss()
            this.currentFile = undefined
            return
          }

          const currentFileIndex = this.otherFiles.findIndex((file) => file.uuid === this.currentFile?.uuid)
          const nextFileIndex = currentFileIndex + 1 < this.otherFiles.length ? currentFileIndex + 1 : 0
          this.setCurrentFile(this.otherFiles[nextFileIndex])
          this.otherFiles = this.otherFiles.filter((file) => file.uuid !== this.currentFile?.uuid)
        }
      }),
    )
  }

  deinit = () => {
    this.eventObservers.forEach((observer) => observer())
    ;(this.currentFile as any) = undefined
    ;(this.otherFiles as any) = undefined
  }

  setCurrentFile = (currentFile: FileItem) => {
    this.currentFile = currentFile
  }

  activate = (currentFile: FileItem, otherFiles?: FileItem[]) => {
    this.currentFile = currentFile
    if (otherFiles) {
      this.otherFiles = otherFiles
    }
    this.isOpen = true
  }

  dismiss = () => {
    this.isOpen = false
  }
}
