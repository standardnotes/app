import { FileItem, PrefKey, SNNote } from '@standardnotes/models'
import { removeFromArray } from '@standardnotes/utils'
import { ApplicationEvent } from '@standardnotes/services'

import { SNApplication } from '../Application/Application'

import { NoteViewController } from './NoteViewController'
import { FileViewController } from './FileViewController'
import { TemplateNoteViewControllerOptions } from './TemplateNoteViewControllerOptions'

type ItemControllerGroupChangeCallback = (activeController: NoteViewController | FileViewController | undefined) => void

type CreateItemControllerOptions = FileItem | SNNote | TemplateNoteViewControllerOptions

export class ItemGroupController {
  public itemControllers: (NoteViewController | FileViewController)[] = []
  private addTagHierarchy: boolean
  changeObservers: ItemControllerGroupChangeCallback[] = []
  eventObservers: (() => void)[] = []

  constructor(private application: SNApplication) {
    this.addTagHierarchy = application.getPreference(PrefKey.NoteAddToParentFolders, true)

    this.eventObservers.push(
      application.addSingleEventObserver(ApplicationEvent.PreferencesChanged, async () => {
        this.addTagHierarchy = application.getPreference(PrefKey.NoteAddToParentFolders, true)
      }),
    )
  }

  public deinit(): void {
    ;(this.application as unknown) = undefined

    this.eventObservers.forEach((removeObserver) => {
      removeObserver()
    })

    this.changeObservers.length = 0

    for (const controller of this.itemControllers) {
      this.closeItemController(controller, { notify: false })
    }

    this.itemControllers.length = 0
  }

  async createItemController(options: CreateItemControllerOptions): Promise<NoteViewController | FileViewController> {
    if (this.activeItemViewController) {
      this.closeItemController(this.activeItemViewController, { notify: false })
    }

    let controller!: NoteViewController | FileViewController

    if (options instanceof FileItem) {
      const file = options
      controller = new FileViewController(this.application, file)
    } else if (options instanceof SNNote) {
      const note = options
      controller = new NoteViewController(this.application, note)
    } else {
      controller = new NoteViewController(this.application, undefined, options)
    }

    this.itemControllers.push(controller)

    await controller.initialize(this.addTagHierarchy)

    this.notifyObservers()

    return controller
  }

  public closeItemController(
    controller: NoteViewController | FileViewController,
    { notify = true }: { notify: boolean } = { notify: true },
  ): void {
    controller.deinit()

    removeFromArray(this.itemControllers, controller)

    if (notify) {
      this.notifyObservers()
    }
  }

  closeActiveItemController(): void {
    const activeController = this.activeItemViewController

    if (activeController) {
      this.closeItemController(activeController, { notify: true })
    }
  }

  closeAllItemControllers(): void {
    for (const controller of this.itemControllers) {
      this.closeItemController(controller, { notify: false })
    }

    this.notifyObservers()
  }

  get activeItemViewController(): NoteViewController | FileViewController | undefined {
    return this.itemControllers[0]
  }

  /**
   * Notifies observer when the active controller has changed.
   */
  public addActiveControllerChangeObserver(callback: ItemControllerGroupChangeCallback): () => void {
    this.changeObservers.push(callback)

    if (this.activeItemViewController) {
      callback(this.activeItemViewController)
    }

    const thislessChangeObservers = this.changeObservers
    return () => {
      removeFromArray(thislessChangeObservers, callback)
    }
  }

  private notifyObservers(): void {
    for (const observer of this.changeObservers) {
      observer(this.activeItemViewController)
    }
  }
}
